import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('[ServerError]', err);

  // If response has already started sending
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  // Mask sensitive internal details or environment variables
  let userMessage = err.message || 'An unexpected error occurred on the LabLens AI server.';

  // Mask any accidental API key leaks in error message
  userMessage = userMessage.replace(/sk-[a-zA-Z0-9_-]{10,}/g, 'sk-***');

  res.status(statusCode).json({
    error: userMessage,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
}
