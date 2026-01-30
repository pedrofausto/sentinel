import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

// Helmet configuration for security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// XSS sanitization middleware
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Basic XSS prevention - escape HTML entities
        result[key] = (obj[key] as string)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        result[key] = sanitize(obj[key] as Record<string, unknown>);
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }

  next();
};

// Request logging for security audit
export const auditLog = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Request:', JSON.stringify(logData));
    }
  });

  next();
};
