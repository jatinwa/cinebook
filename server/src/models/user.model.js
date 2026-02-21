import { query } from '../config/db.js';

export const UserModel = {
  // Create a new user
  async create({ name, email, passwordHash }) {
    const result = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash]
    );
    return result.rows[0];
  },

  // Find by email (for login)
  async findByEmail(email) {
    const result = await query(
      `SELECT id, name, email, password_hash, role FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  },

  // Find by ID
  async findById(id) {
    const result = await query(
      `SELECT id, name, email, role, created_at FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },
};