import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { initSocket } from './socket/index.js';
import cookieParser from 'cookie-parser'

// Route imports (we'll add these next)
import authRoutes from './routes/auth.routes.js';
import movieRoutes from './routes/movie.routes.js';
import showRoutes from './routes/show.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import adminRoutes from './routes/admin.routes.js';

import './workers/index.js'; 

const app = express();
const httpServer = http.createServer(app);

// Init WebSocket
initSocket(httpServer);

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', env: ENV.NODE_ENV }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use(errorHandler);

// Start server
httpServer.listen(ENV.PORT, () => {
  console.log(`🚀 Server running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
});