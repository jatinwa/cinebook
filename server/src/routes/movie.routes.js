import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { MovieModel } from '../models/movie.model.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/', asyncHandler(async (req, res) => {
  const { genre, language, search } = req.query;
  const movies = await MovieModel.findAll({ genre, language, search });
  res.json({ success: true, data: movies });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const movie = await MovieModel.findById(req.params.id);
  if (!movie) throw new AppError('Movie not found', 404);
  res.json({ success: true, data: movie });
}));

// Admin only
router.post('/', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const movie = await MovieModel.create(req.body);
  res.status(201).json({ success: true, data: movie });
}));

router.put('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const movie = await MovieModel.update(req.params.id, req.body);
  res.json({ success: true, data: movie });
}));

router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  await MovieModel.delete(req.params.id);
  res.json({ success: true, message: 'Movie deleted' });
}));

export default router;