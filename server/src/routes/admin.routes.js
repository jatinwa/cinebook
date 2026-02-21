import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { TheatreModel } from '../models/theatre.model.js';
import { ScreenModel } from '../models/screen.model.js';
import { ShowModel } from '../models/show.model.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All admin routes require auth + admin role
router.use(authenticate, authorize('admin'));

// Theatres
router.post('/theatres', asyncHandler(async (req, res) => {
  const theatre = await TheatreModel.create(req.body);
  res.status(201).json({ success: true, data: theatre });
}));

router.get('/theatres', asyncHandler(async (req, res) => {
  const theatres = await TheatreModel.findAll();
  res.json({ success: true, data: theatres });
}));

// Screens (with auto seat generation)
router.post('/theatres/:theatreId/screens', asyncHandler(async (req, res) => {
  const screen = await ScreenModel.createWithSeats({
    theatreId: req.params.theatreId,
    ...req.body,
    // body should include: name, rows (['A','B','C']), seatsPerRow (10), categories ({A:'vip',B:'premium',C:'standard'})
  });
  res.status(201).json({ success: true, data: screen });
}));

router.get('/theatres/:theatreId/screens', asyncHandler(async (req, res) => {
  const screens = await ScreenModel.findByTheatre(req.params.theatreId);
  res.json({ success: true, data: screens });
}));

// Shows
router.post('/shows', asyncHandler(async (req, res) => {
  const show = await ShowModel.create(req.body);
  res.status(201).json({ success: true, data: show });
}));

export default router;