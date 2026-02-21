import { query, getClient } from '../config/db.js';
import redis from '../config/redis.js';
import { seatReleaseQueue } from '../config/queues.js';
import { emitSeatUpdate } from '../socket/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { ENV } from '../config/env.js';

export const SeatService = {

  // ── Get all seats for a show with their current status ──────────────────
  async getShowSeats(showId) {
    const result = await query(
      `SELECT
         ss.id AS show_seat_id,
         ss.status,
         ss.price,
         ss.locked_until,
         s.row_label,
         s.seat_number,
         s.category
       FROM show_seats ss
       JOIN seats s ON s.id = ss.seat_id
       WHERE ss.show_id = $1
       ORDER BY s.row_label, s.seat_number`,
      [showId]
    );
    return result.rows;
  },

  // ── Lock seats for a user (seat selection step) ──────────────────────────
  //
  // Flow:
  //  1. Acquire a Redis distributed lock to prevent race conditions
  //  2. Check seats are still available in DB (source of truth)
  //  3. Mark seats as 'locked' in DB with TTL timestamp
  //  4. Store lock metadata in Redis for fast TTL lookup
  //  5. Schedule a BullMQ job to auto-release after 10 mins
  //  6. Broadcast seat status change via WebSocket
  //
  async lockSeats(showId, showSeatIds, userId) {
    // ── Step 1: Distributed lock via Redis ──────────────────────────────
    // Prevents two users from locking the same seats simultaneously
    // SETNX = SET if Not eXists, expires in 10 seconds
    const lockKey = `lock:show:${showId}:user:${userId}`;
    const acquired = await redis.set(lockKey, '1', 'EX', 10, 'NX');

    if (!acquired) {
      throw new AppError('Another request in progress, please wait.', 429);
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // ── Step 2: Check availability with row-level lock ──────────────
      // SELECT FOR UPDATE locks these rows so no other transaction
      // can modify them until we commit. This is pessimistic locking.
      const result = await client.query(
        `SELECT id, status FROM show_seats
         WHERE id = ANY($1::uuid[])
           AND show_id = $2
         FOR UPDATE`,
        [showSeatIds, showId]
      );

      if (result.rows.length !== showSeatIds.length) {
        throw new AppError('One or more seats not found for this show', 404);
      }

      // Check all are available
      const unavailable = result.rows.filter((r) => r.status !== 'available');
      if (unavailable.length > 0) {
        throw new AppError(
          `${unavailable.length} seat(s) are no longer available`,
          409
        );
      }

      // ── Step 3: Mark seats as locked in DB ──────────────────────────
      const lockedUntil = new Date(Date.now() + ENV.SEAT_LOCK_TTL * 1000);
      await client.query(
        `UPDATE show_seats
         SET status = 'locked', locked_by = $1, locked_until = $2
         WHERE id = ANY($3::uuid[])`,
        [userId, lockedUntil, showSeatIds]
      );

      await client.query('COMMIT');

      // ── Step 4: Store in Redis for fast access ───────────────────────
      const redisKey = `seat_lock:${userId}:${showId}`;
      await redis.set(
        redisKey,
        JSON.stringify({ showSeatIds, showId }),
        'EX',
        ENV.SEAT_LOCK_TTL
      );

      // ── Step 5: Schedule auto-release job ───────────────────────────
      // If user doesn't complete payment within 10 mins, worker releases seats
      await seatReleaseQueue.add(
        'release-expired-locks',
        { showSeatIds, showId },
        {
          delay: ENV.SEAT_LOCK_TTL * 1000,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        }
      );

      // ── Step 6: Broadcast to all clients in this show room ───────────
      const seatUpdates = showSeatIds.map((id) => ({ showSeatId: id, status: 'locked' }));
      emitSeatUpdate(showId, seatUpdates);

      return { lockedUntil, showSeatIds };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
      // Always release the distributed Redis lock
      await redis.del(lockKey);
    }
  },

  // ── Release seats manually (user deselects or navigates away) ───────────
  async releaseSeats(showId, showSeatIds, userId) {
    await query(
      `UPDATE show_seats
       SET status = 'available', locked_by = NULL, locked_until = NULL
       WHERE id = ANY($1::uuid[])
         AND show_id = $2
         AND locked_by = $3
         AND status = 'locked'`,
      [showSeatIds, showId, userId]
    );

    // Clear from Redis
    const redisKey = `seat_lock:${userId}:${showId}`;
    await redis.del(redisKey);

    // Broadcast release
    const seatUpdates = showSeatIds.map((id) => ({ showSeatId: id, status: 'available' }));
    emitSeatUpdate(showId, seatUpdates);
  },
};