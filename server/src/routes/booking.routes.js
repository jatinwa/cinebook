import { Router } from 'express';
import {
  confirmBooking,
  cancelBooking,
  getUserBookings,
  getBookingById,
} from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

router.post('/confirm', bookingLimiter, confirmBooking);   // POST /api/bookings/confirm
router.get('/', getUserBookings);                          // GET  /api/bookings
router.get('/:id', getBookingById);                        // GET  /api/bookings/:id
router.post('/:id/cancel', cancelBooking);                 // POST /api/bookings/:id/cancel

export default router;