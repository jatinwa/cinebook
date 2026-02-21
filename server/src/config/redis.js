import Redis from 'ioredis';
import { ENV } from './env.js';

// Upstash gives you a Redis URL with auth token embedded
const redis = new Redis(ENV.REDIS_URL, {
  tls: {},               // Upstash requires TLS
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

export default redis;