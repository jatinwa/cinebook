import { Queue } from 'bullmq';
import { ENV } from './env.js';

const connection = {
  url: ENV.REDIS_URL,
  ...(ENV.NODE_ENV === 'production' && { tls: {} }),
};

export const emailQueue = new Queue('email', { connection });
export const seatReleaseQueue = new Queue('seat-release', { connection });
export const notificationQueue = new Queue('notification', { connection });

console.log('✅ BullMQ queues initialized');