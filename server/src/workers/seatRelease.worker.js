import { Worker } from 'bullmq';
import { query } from '../config/db.js';
import { emitSeatUpdate } from '../socket/index.js';
import { ENV } from '../config/env.js';

const connection = { url: ENV.REDIS_URL, tls: {} };

const seatReleaseWorker = new Worker(
  'seat-release',
  async (job) => {
    const { showSeatIds, showId } = job.data;

    // Release seats that are still in 'locked' state
    // (if already booked, this won't touch them — status check is key)
    const result = await query(
      `UPDATE show_seats
       SET status = 'available', locked_by = NULL, locked_until = NULL
       WHERE id = ANY($1::uuid[])
         AND status = 'locked'
       RETURNING id, seat_id`,
      [showSeatIds]
    );

    if (result.rowCount > 0) {
      console.log(`🔓 Released ${result.rowCount} locked seats for show ${showId}`);

      // Notify all clients in this show's room about the seat status change
      const updatedSeats = result.rows.map((r) => ({
        showSeatId: r.id,
        seatId: r.seat_id,
        status: 'available',
      }));

      emitSeatUpdate(showId, updatedSeats);
    }
  },
  { connection }
);

seatReleaseWorker.on('failed', (job, err) =>
  console.error(`❌ Seat release job ${job.id} failed:`, err.message)
);

export default seatReleaseWorker;