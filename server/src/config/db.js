import pg from 'pg';
import dns from 'dns';

// Force IPv4 — critical for Render free tier
dns.setDefaultResultOrder('ipv4first');

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => console.log('✅ DB connected'));
pool.on('error', (err) => console.error('❌ DB error:', err.message));

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();

export default pool;