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

router.use(authenticate);

router.post('/confirm', bookingLimiter, confirmBooking);
router.get('/', getUserBookings);
router.get('/:id', getBookingById);
router.post('/:id/cancel', cancelBooking);

export default router;