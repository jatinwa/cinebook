import { Queue } from 'bullmq';
import { ENV } from './env.js';

const connection = {
  url: ENV.REDIS_URL,
  tls: ENV.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 500, 2000);
  },
};

export const emailQueue = new Queue('email', { connection });
export const seatReleaseQueue = new Queue('seat-release', { connection });
export const notificationQueue = new Queue('notification', { connection });

console.log('✅ BullMQ queues initialized');