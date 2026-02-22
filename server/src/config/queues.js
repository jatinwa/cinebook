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

const queueOptions = {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 1000,
  },
  skipVersionCheck: true,
};

export const emailQueue = new Queue('email', queueOptions);
export const seatReleaseQueue = new Queue('seat-release', queueOptions);
export const notificationQueue = new Queue('notification', queueOptions);

console.log('✅ BullMQ queues initialized');