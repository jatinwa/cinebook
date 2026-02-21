import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { UserModel } from '../models/user.model.js';
import { TokenModel } from '../models/token.model.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Token Helpers ───────────────────────────────────────────────────────────

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    ENV.JWT_ACCESS_SECRET,
    { expiresIn: ENV.JWT_ACCESS_EXPIRES_IN } // 15 minutes
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user.id },
    ENV.JWT_REFRESH_SECRET,
    { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN } // 7 days
  );

// ─── Auth Service ────────────────────────────────────────────────────────────

export const AuthService = {
  async register({ name, email, password }) {
    // Check if user already exists
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new AppError('Email already registered', 409);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await UserModel.create({ name, email, passwordHash });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await TokenModel.save({ userId: user.id, token: refreshToken, expiresAt });

    return { user, accessToken, refreshToken };
  },

  async login({ email, password }) {
    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) throw new AppError('Invalid email or password', 401);

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new AppError('Invalid email or password', 401);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await TokenModel.save({ userId: user.id, token: refreshToken, expiresAt });

    const { password_hash, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
  },

  async refresh(refreshToken) {
    if (!refreshToken) throw new AppError('Refresh token required', 401);

    // Verify JWT signature
    let payload;
    try {
      payload = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Check if token exists in DB (wasn't logged out)
    const storedToken = await TokenModel.findValid(refreshToken);
    if (!storedToken) throw new AppError('Refresh token revoked', 401);

    // Get user
    const user = await UserModel.findById(payload.id);
    if (!user) throw new AppError('User not found', 404);

    // Rotate — delete old, issue new (prevents token reuse attacks)
    await TokenModel.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await TokenModel.save({ userId: user.id, token: newRefreshToken, expiresAt });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken) {
    if (refreshToken) {
      await TokenModel.delete(refreshToken);
    }
  },
};
