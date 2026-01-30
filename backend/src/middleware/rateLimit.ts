import rateLimit from 'express-rate-limit';
import { Response } from 'express';

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: 900, // 15 minutes in seconds
    });
  },
});

// Stricter rate limiter for authentication routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// AI endpoint rate limiter (more expensive operations)
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 AI requests per minute
  message: {
    error: 'Too many AI requests, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
