export const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.message}`);
  
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
  
    res.status(status).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
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
  