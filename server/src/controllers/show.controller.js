import { ShowModel } from '../models/show.model.js';
import { SeatService } from '../services/seat.service.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const lockSchema = z.object({
  showSeatIds: z.array(z.string().uuid()).min(1).max(10),
});

export const getShowsByMovie = asyncHandler(async (req, res) => {
  const shows = await ShowModel.findByMovie(req.params.movieId);
  res.json({ success: true, data: shows });
});

export const getShowById = asyncHandler(async (req, res) => {
  const show = await ShowModel.findById(req.params.id);
  if (!show) throw new AppError('Show not found', 404);
  res.json({ success: true, data: show });
});

export const getShowSeats = asyncHandler(async (req, res) => {
  const seats = await SeatService.getShowSeats(req.params.id);
  res.json({ success: true, data: seats });
});

export const lockSeats = asyncHandler(async (req, res) => {
  const parsed = lockSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() });
  }

  const result = await SeatService.lockSeats(
    req.params.id,
    parsed.data.showSeatIds,
    req.user.id
  );

  res.json({ success: true, message: 'Seats locked successfully', data: result });
});

export const releaseSeats = asyncHandler(async (req, res) => {
  const { showSeatIds } = req.body;
  await SeatService.releaseSeats(req.params.id, showSeatIds, req.user.id);
  res.json({ success: true, message: 'Seats released' });
});