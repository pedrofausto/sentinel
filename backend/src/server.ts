import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { securityHeaders, sanitizeInput, auditLog } from './middleware/security.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import routes from './routes/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting behind nginx
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security & logging
app.use(sanitizeInput);
app.use(auditLog);

// Rate limiting
app.use('/api', apiRateLimiter);

// Routes
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Startup
async function start() {
  console.log('🚀 Starting Sentinel CTI Backend...');

  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Connect to Redis (optional - don't fail if unavailable)
  const redisConnected = await connectRedis();
  if (!redisConnected) {
    console.warn('⚠️ Redis not available. Some features may be limited.');
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);
    console.log(`🔒 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });
}

start().catch(console.error);

export default app;
