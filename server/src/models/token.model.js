import { query } from '../config/db.js';

export const TokenModel = {
  // Save refresh token to DB
  async save({ userId, token, expiresAt }) {
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );
  },

  // Find and validate a refresh token
  async findValid(token) {
    const result = await query(
      `SELECT * FROM refresh_tokens
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    return result.rows[0] || null;
  },

  // Delete a specific refresh token (logout)
  async delete(token) {
    await query(`DELETE FROM refresh_tokens WHERE token = $1`, [token]);
  },

  // Delete all tokens for a user (logout from all devices)
  async deleteAllForUser(userId) {
    await query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
  },
};