export const errorHandler = (err, req, res, next) => {
  // Always log the full error server-side
  console.error(`[Error] ${req.method} ${req.path} →`, err.message);
  if (err.stack) console.error(err.stack);

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Only expose stack in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Wrap async route handlers to avoid try/catch everywhere
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}
