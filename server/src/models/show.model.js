import { query, getClient } from '../config/db.js';

export const ShowModel = {
  // Create show + generate show_seats for every seat in that screen
  async create({ movieId, screenId, startTime, endTime, basePrice }) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Create the show
      const showResult = await client.query(
        `INSERT INTO shows (movie_id, screen_id, start_time, end_time, base_price)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [movieId, screenId, startTime, endTime, basePrice]
      );
      const show = showResult.rows[0];

      // Fetch all seats for this screen
      const seatsResult = await client.query(
        `SELECT id, category FROM seats WHERE screen_id = $1`,
        [screenId]
      );

      // Generate show_seats with price multipliers per category
      const priceMap = { standard: 1, premium: 1.5, vip: 2 };
      const showSeatInserts = seatsResult.rows.map((seat) => {
        const price = (basePrice * (priceMap[seat.category] || 1)).toFixed(2);
        return client.query(
          `INSERT INTO show_seats (show_id, seat_id, price)
           VALUES ($1, $2, $3)`,
          [show.id, seat.id, price]
        );
      });

      await Promise.all(showSeatInserts);
      await client.query('COMMIT');

      return show;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Get all shows for a movie with theatre/screen info
  async findByMovie(movieId) {
    const result = await query(
      `SELECT
         sh.id, sh.start_time, sh.end_time, sh.base_price, sh.status,
         sc.name AS screen_name, sc.total_seats,
         t.name AS theatre_name, t.location AS theatre_location,
         COUNT(ss.id) FILTER (WHERE ss.status = 'available') AS available_seats
       FROM shows sh
       JOIN screens sc ON sc.id = sh.screen_id
       JOIN theatres t ON t.id = sc.theatre_id
       LEFT JOIN show_seats ss ON ss.show_id = sh.id
       WHERE sh.movie_id = $1
         AND sh.start_time > NOW()
         AND sh.status = 'active'
       GROUP BY sh.id, sc.name, sc.total_seats, t.name, t.location
       ORDER BY sh.start_time`,
      [movieId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await query(
      `SELECT sh.*, m.title AS movie_title, m.duration_mins,
              sc.name AS screen_name, t.name AS theatre_name, t.location
       FROM shows sh
       JOIN movies m ON m.id = sh.movie_id
       JOIN screens sc ON sc.id = sh.screen_id
       JOIN theatres t ON t.id = sc.theatre_id
       WHERE sh.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },
};