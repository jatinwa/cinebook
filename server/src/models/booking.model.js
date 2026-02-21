import { query, getClient } from '../config/db.js';

export const BookingModel = {

  // Get all bookings for a user
  async findByUser(userId) {
    const result = await query(
      `SELECT
         b.id, b.total_amount, b.status, b.booked_at, b.payment_id,
         m.title AS movie_title, m.poster_url,
         sh.start_time, sh.end_time,
         sc.name AS screen_name,
         t.name AS theatre_name, t.location AS theatre_location,
         ARRAY_AGG(s.row_label || s.seat_number::text ORDER BY s.row_label, s.seat_number) AS seats
       FROM bookings b
       JOIN shows sh ON sh.id = b.show_id
       JOIN movies m ON m.id = sh.movie_id
       JOIN screens sc ON sc.id = sh.screen_id
       JOIN theatres t ON t.id = sc.theatre_id
       JOIN booking_seats bs ON bs.booking_id = b.id
       JOIN show_seats ss ON ss.id = bs.show_seat_id
       JOIN seats s ON s.id = ss.seat_id
       WHERE b.user_id = $1
       GROUP BY b.id, m.title, m.poster_url, sh.start_time, sh.end_time,
                sc.name, t.name, t.location
       ORDER BY b.booked_at DESC`,
      [userId]
    );
    return result.rows;
  },

  // Get single booking detail
  async findById(id, userId) {
    const result = await query(
      `SELECT
         b.id, b.total_amount, b.status, b.booked_at, b.payment_id,
         b.user_id,
         m.title AS movie_title, m.poster_url, m.duration_mins,
         sh.start_time, sh.end_time,
         sc.name AS screen_name,
         t.name AS theatre_name, t.location AS theatre_location,
         ARRAY_AGG(
           json_build_object(
             'row', s.row_label,
             'number', s.seat_number,
             'category', s.category,
             'price', ss.price
           )
           ORDER BY s.row_label, s.seat_number
         ) AS seats
       FROM bookings b
       JOIN shows sh ON sh.id = b.show_id
       JOIN movies m ON m.id = sh.movie_id
       JOIN screens sc ON sc.id = sh.screen_id
       JOIN theatres t ON t.id = sc.theatre_id
       JOIN booking_seats bs ON bs.booking_id = b.id
       JOIN show_seats ss ON ss.id = bs.show_seat_id
       JOIN seats s ON s.id = ss.seat_id
       WHERE b.id = $1 AND b.user_id = $2
       GROUP BY b.id, m.title, m.poster_url, m.duration_mins,
                sh.start_time, sh.end_time, sc.name, t.name, t.location`,
      [id, userId]
    );
    return result.rows[0] || null;
  },
};