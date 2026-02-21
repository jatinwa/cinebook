import { query } from '../config/db.js';

export const ScreenModel = {
  // Create screen + auto-generate all its seats in a transaction
  async createWithSeats({ theatreId, name, rows, seatsPerRow, categories }) {
    const client = await import('../config/db.js').then(m => m.getClient());

    try {
      await client.query('BEGIN');

      // Create screen
      const screenResult = await client.query(
        `INSERT INTO screens (theatre_id, name, total_seats)
         VALUES ($1, $2, $3) RETURNING *`,
        [theatreId, name, rows.length * seatsPerRow]
      );
      const screen = screenResult.rows[0];

      // Auto-generate seats: A1, A2... B1, B2...
      // categories = { A: 'vip', B: 'premium', C: 'standard' }
      const seatInserts = [];
      for (const row of rows) {
        for (let num = 1; num <= seatsPerRow; num++) {
          const category = categories[row] || 'standard';
          seatInserts.push(
            client.query(
              `INSERT INTO seats (screen_id, row_label, seat_number, category)
               VALUES ($1, $2, $3, $4)`,
              [screen.id, row, num, category]
            )
          );
        }
      }
      await Promise.all(seatInserts);

      await client.query('COMMIT');
      return screen;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findByTheatre(theatreId) {
    const result = await query(
      `SELECT s.*, COUNT(se.id) as seat_count
       FROM screens s
       LEFT JOIN seats se ON se.screen_id = s.id
       WHERE s.theatre_id = $1
       GROUP BY s.id`,
      [theatreId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await query(`SELECT * FROM screens WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },
};