import { Queue } from 'bullmq';
import { ENV } from './env.js';

// BullMQ needs Redis connection config separately (not ioredis instance)
const connection = {
  url: ENV.REDIS_URL,
  tls: {},
};

// Define all queues here
export const emailQueue = new Queue('email', { connection });
export const seatReleaseQueue = new Queue('seat-release', { connection });
export const notificationQueue = new Queue('notification', { connection });

console.log('✅ BullMQ queues initialized');
