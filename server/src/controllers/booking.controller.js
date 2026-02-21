import { getClient, query } from '../config/db.js';
import redis from '../config/redis.js';
import { emailQueue } from '../config/queues.js';
import { emitSeatUpdate } from '../socket/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { BookingModel } from '../models/booking.model.js';
import { UserModel } from '../models/user.model.js';

export const BookingService = {

  // ── Confirm Booking ──────────────────────────────────────────────────────
  //
  // This entire flow runs inside ONE database transaction.
  // If anything fails — payment, DB insert, anything — it ALL rolls back.
  // The user never gets charged for a failed booking.
  //
  // Flow:
  //  1. Verify seats are still locked by THIS user
  //  2. Calculate total amount
  //  3. Mark seats as 'booked' (permanent)
  //  4. Create booking record
  //  5. Create booking_seats records
  //  6. Clear Redis lock
  //  7. Queue confirmation email
  //  8. Broadcast seat status via WebSocket
  //
  async confirmBooking({ userId, showId, showSeatIds, paymentId }) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // ── Step 1: Verify seats are locked by this user ─────────────────
      // SELECT FOR UPDATE ensures no other transaction touches these rows
      const seatResult = await client.query(
        `SELECT
           ss.id, ss.status, ss.locked_by, ss.locked_until, ss.price,
           s.row_label, s.seat_number, s.category
         FROM show_seats ss
         JOIN seats s ON s.id = ss.seat_id
         WHERE ss.id = ANY($1::uuid[])
           AND ss.show_id = $2
         FOR UPDATE`,
        [showSeatIds, showId]
      );

      if (seatResult.rows.length !== showSeatIds.length) {
        throw new AppError('One or more seats not found', 404);
      }

      // Validate every seat is locked by this user and lock hasn't expired
      for (const seat of seatResult.rows) {
        if (seat.status !== 'locked') {
          throw new AppError(
            `Seat ${seat.row_label}${seat.seat_number} is not locked`,
            409
          );
        }
        if (seat.locked_by !== userId) {
          throw new AppError(
            `Seat ${seat.row_label}${seat.seat_number} is locked by another user`,
            409
          );
        }
        if (new Date(seat.locked_until) < new Date()) {
          throw new AppError(
            `Seat ${seat.row_label}${seat.seat_number} lock has expired. Please reselect.`,
            409
          );
        }
      }

      // ── Step 2: Calculate total ──────────────────────────────────────
      const totalAmount = seatResult.rows
        .reduce((sum, seat) => sum + parseFloat(seat.price), 0)
        .toFixed(2);

      // ── Step 3: Mark seats as permanently booked ─────────────────────
      await client.query(
        `UPDATE show_seats
         SET status = 'booked', locked_by = NULL, locked_until = NULL
         WHERE id = ANY($1::uuid[])`,
        [showSeatIds]
      );

      // ── Step 4: Create booking record ────────────────────────────────
      const bookingResult = await client.query(
        `INSERT INTO bookings (user_id, show_id, total_amount, status, payment_id)
         VALUES ($1, $2, $3, 'confirmed', $4)
         RETURNING *`,
        [userId, showId, totalAmount, paymentId || null]
      );
      const booking = bookingResult.rows[0];

      // ── Step 5: Create booking_seats records ─────────────────────────
      const bookingSeatInserts = showSeatIds.map((showSeatId) =>
        client.query(
          `INSERT INTO booking_seats (booking_id, show_seat_id)
           VALUES ($1, $2)`,
          [booking.id, showSeatId]
        )
      );
      await Promise.all(bookingSeatInserts);

      // ── Commit transaction ───────────────────────────────────────────
      await client.query('COMMIT');

      // ── Step 6: Clear Redis lock ─────────────────────────────────────
      // Do this AFTER commit so if Redis fails, booking is still valid
      const redisKey = `seat_lock:${userId}:${showId}`;
      await redis.del(redisKey).catch(console.error);

      // ── Step 7: Fetch full show details for email ────────────────────
      const showResult = await query(
        `SELECT sh.start_time, m.title AS movie_title,
                t.name AS theatre_name, sc.name AS screen_name
         FROM shows sh
         JOIN movies m ON m.id = sh.movie_id
         JOIN screens sc ON sc.id = sh.screen_id
         JOIN theatres t ON t.id = sc.theatre_id
         WHERE sh.id = $1`,
        [showId]
      );
      const show = showResult.rows[0];
      const user = await UserModel.findById(userId);

      const seatLabels = seatResult.rows.map(
        (s) => `${s.row_label}${s.seat_number} (${s.category})`
      );

      // ── Queue confirmation email ─────────────────────────────────────
      await emailQueue.add(
        'booking-confirmation',
        {
          type: 'BOOKING_CONFIRMATION',
          to: user.email,
          data: {
            userName: user.name,
            movieTitle: show.movie_title,
            theatreName: show.theatre_name,
            screenName: show.screen_name,
            showTime: new Date(show.start_time).toLocaleString('en-IN', {
              dateStyle: 'full',
              timeStyle: 'short',
            }),
            seats: seatLabels,
            totalAmount,
            bookingId: booking.id,
          },
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: true,
        }
      );

      // ── Step 8: Broadcast booked status via WebSocket ────────────────
      const seatUpdates = showSeatIds.map((id) => ({ showSeatId: id, status: 'booked' }));
      emitSeatUpdate(showId, seatUpdates);

      return { booking, seats: seatResult.rows, totalAmount };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ── Cancel Booking ───────────────────────────────────────────────────────
  //
  // Flow:
  //  1. Verify booking belongs to user
  //  2. Check show hasn't started yet (can't cancel past shows)
  //  3. Mark booking as cancelled
  //  4. Release seats back to available
  //  5. Queue cancellation email
  //  6. Broadcast seat release via WebSocket
  //
  async cancelBooking(bookingId, userId) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // ── Step 1: Fetch booking with show details ───────────────────────
      const bookingResult = await client.query(
        `SELECT b.*, sh.start_time, sh.id AS show_id
         FROM bookings b
         JOIN shows sh ON sh.id = b.show_id
         WHERE b.id = $1 AND b.user_id = $2
         FOR UPDATE`,
        [bookingId, userId]
      );

      const booking = bookingResult.rows[0];
      if (!booking) throw new AppError('Booking not found', 404);
      if (booking.status === 'cancelled') throw new AppError('Booking already cancelled', 409);

      // ── Step 2: Check show hasn't started ────────────────────────────
      if (new Date(booking.start_time) <= new Date()) {
        throw new AppError('Cannot cancel after show has started', 400);
      }

      // ── Step 3: Mark booking as cancelled ────────────────────────────
      await client.query(
        `UPDATE bookings SET status = 'cancelled' WHERE id = $1`,
        [bookingId]
      );

      // ── Step 4: Get show_seat IDs and release them ────────────────────
      const showSeatsResult = await client.query(
        `SELECT ss.id AS show_seat_id
         FROM booking_seats bs
         JOIN show_seats ss ON ss.id = bs.show_seat_id
         WHERE bs.booking_id = $1`,
        [bookingId]
      );

      const showSeatIds = showSeatsResult.rows.map((r) => r.show_seat_id);

      await client.query(
        `UPDATE show_seats
         SET status = 'available', locked_by = NULL, locked_until = NULL
         WHERE id = ANY($1::uuid[])`,
        [showSeatIds]
      );

      await client.query('COMMIT');

      // ── Step 5: Queue cancellation email ─────────────────────────────
      const user = await UserModel.findById(userId);
      const showInfo = await query(
        `SELECT m.title FROM shows sh JOIN movies m ON m.id = sh.movie_id WHERE sh.id = $1`,
        [booking.show_id]
      );

      await emailQueue.add(
        'booking-cancellation',
        {
          type: 'BOOKING_CANCELLATION',
          to: user.email,
          data: {
            userName: user.name,
            bookingId: booking.id,
            movieTitle: showInfo.rows[0]?.title,
          },
        },
        { attempts: 3, backoff: { type: 'exponential', delay: 3000 } }
      );

      // ── Step 6: Broadcast seat availability ───────────────────────────
      const seatUpdates = showSeatIds.map((id) => ({ showSeatId: id, status: 'available' }));
      emitSeatUpdate(booking.show_id, seatUpdates);

      return { message: 'Booking cancelled successfully', bookingId };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getUserBookings(userId) {
    return BookingModel.findByUser(userId);
  },

  async getBookingById(bookingId, userId) {
    const booking = await BookingModel.findById(bookingId, userId);
    if (!booking) throw new AppError('Booking not found', 404);
    return booking;
  },
};