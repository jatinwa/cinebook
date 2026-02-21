import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // stricter for login/register
  message: { success: false, message: 'Too many auth attempts.' },
});

export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5, // max 5 booking attempts per minute
  message: { success: false, message: 'Booking rate limit exceeded.' },
});