import pg from 'pg';
import { ENV } from './env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Supabase
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB error', err);
  process.exit(-1);
});

// Helper: run query
export const query = (text, params) => pool.query(text, params);

// Helper: get a client for transactions
export const getClient = () => pool.connect();

export default pool;