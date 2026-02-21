import { query } from '../config/db.js';

export const MovieModel = {
  async create({ title, description, durationMins, genre, language, posterUrl, releaseDate }) {
    const result = await query(
      `INSERT INTO movies (title, description, duration_mins, genre, language, poster_url, release_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description, durationMins, genre, language, posterUrl, releaseDate]
    );
    return result.rows[0];
  },

  async findAll({ genre, language, search } = {}) {
    let sql = `SELECT * FROM movies WHERE 1=1`;
    const params = [];

    if (genre) {
      params.push(genre);
      sql += ` AND genre = $${params.length}`;
    }
    if (language) {
      params.push(language);
      sql += ` AND language = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND title ILIKE $${params.length}`;
    }

    sql += ` ORDER BY release_date DESC`;
    const result = await query(sql, params);
    return result.rows;
  },

  async findById(id) {
    const result = await query(`SELECT * FROM movies WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const result = await query(
      `UPDATE movies SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await query(`DELETE FROM movies WHERE id = $1`, [id]);
  },
};