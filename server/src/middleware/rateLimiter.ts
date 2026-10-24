import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

export const chatRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this client. Please slow down and wait a minute before sending more queries.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
