import { Router } from 'express';
import {
  getShowsByMovie,
  getShowById,
  getShowSeats,
  lockSeats,
  releaseSeats,
} from '../controllers/show.controller.js';
import { authenticate } from '../middleware/auth.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/movie/:movieId', getShowsByMovie);         // GET /api/shows/movie/:movieId
router.get('/:id', getShowById);                        // GET /api/shows/:id
router.get('/:id/seats', getShowSeats);                 // GET /api/shows/:id/seats

// Protected — must be logged in to lock seats
router.post('/:id/lock', authenticate, bookingLimiter, lockSeats);    // POST /api/shows/:id/lock
router.post('/:id/release', authenticate, releaseSeats);              // POST /api/shows/:id/release

export default router;