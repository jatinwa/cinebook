import pg from 'pg';
import { ENV } from './env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  // ── Critical for Supabase ──────────────────────────────────────────
  ssl: ENV.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }  // Supabase uses self-signed certs
    : false,
  // ──────────────────────────────────────────────────────────────────
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,  // increased for cold starts on Render
});

pool.on('connect', () => console.log('✅ DB connected'));
pool.on('error', (err) => {
  console.error('❌ DB pool error:', err.message);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();

export default pool;