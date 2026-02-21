import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AppError } from './errorHandler.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('Forbidden: insufficient permissions', 403));
  }
  next();
};