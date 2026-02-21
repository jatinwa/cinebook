import Redis from 'ioredis';
import { ENV } from './env.js';

const redis = new Redis(ENV.REDIS_URL, {
  tls: ENV.NODE_ENV === 'production' ? {} : undefined,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

export default redis;