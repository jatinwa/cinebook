import { BookingService } from '../services/booking.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { z } from 'zod';

const confirmSchema = z.object({
  showId: z.string().uuid(),
  showSeatIds: z.array(z.string().uuid()).min(1).max(10),
  paymentId: z.string().optional(),
});

export const confirmBooking = asyncHandler(async (req, res) => {
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() });
  }

  const result = await BookingService.confirmBooking({
    userId: req.user.id,
    ...parsed.data,
  });

  res.status(201).json({
    success: true,
    message: 'Booking confirmed!',
    data: result,
  });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const result = await BookingService.cancelBooking(req.params.id, req.user.id);
  res.json({ success: true, ...result });
});

export const getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await BookingService.getUserBookings(req.user.id);
  res.json({ success: true, data: bookings });
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await BookingService.getBookingById(req.params.id, req.user.id);
  res.json({ success: true, data: booking });
});