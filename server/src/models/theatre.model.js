import { query } from '../config/db.js';

export const TheatreModel = {
  async create({ name, location }) {
    const result = await query(
      `INSERT INTO theatres (name, location) VALUES ($1, $2) RETURNING *`,
      [name, location]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await query(`SELECT * FROM theatres ORDER BY name`);
    return result.rows;
  },

  async findById(id) {
    const result = await query(`SELECT * FROM theatres WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },
};