import Redis from 'ioredis';
import { ENV } from './env.js';

if (!ENV.REDIS_URL) {
  throw new Error('REDIS_URL is not defined in .env');
}

// Validate URL format before connecting
if (!ENV.REDIS_URL.startsWith('redis://') && !ENV.REDIS_URL.startsWith('rediss://')) {
  throw new Error(`Invalid REDIS_URL format. Must start with redis:// or rediss://. Got: ${ENV.REDIS_URL.substring(0, 20)}...`);
}

const redis = new Redis(ENV.REDIS_URL, {
  tls: ENV.REDIS_URL.startsWith('rediss://') ? {} : undefined,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      console.error('❌ Redis failed after 3 retries — check your REDIS_URL in .env');
      return null; // stop retrying — prevents infinite loop
    }
    return Math.min(times * 500, 2000);
  },
  enableOfflineQueue: false, // fail fast instead of queuing commands
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => {
  // Log once, don't let it spam
  console.error('Redis error:', err.message);
});

export default redis;