import { AuthService } from '../services/auth.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { z } from 'zod';

// ─── Validation Schemas ──────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Controllers ─────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() });
  }

  const { user, accessToken, refreshToken } = await AuthService.register(parsed.data);

  // Send refresh token as httpOnly cookie (more secure than localStorage)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user, accessToken },
  });
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() });
  }

  const { user, accessToken, refreshToken } = await AuthService.login(parsed.data);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: { user, accessToken },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  // Read from httpOnly cookie
  const refreshToken = req.cookies?.refreshToken;

  const { accessToken, refreshToken: newRefreshToken } = await AuthService.refresh(refreshToken);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: { accessToken },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  await AuthService.logout(refreshToken);

  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});