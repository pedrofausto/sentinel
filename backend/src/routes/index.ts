import { Router } from 'express';
import authRoutes from './auth';
import organizationsRoutes from './organizations';
import pirsRoutes from './pirs';
import sourcesRoutes from './sources';
import reportsRoutes from './reports';
import disseminationsRoutes from './disseminations';
import metricsRoutes from './metrics';
import chatRoutes from './chat';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/organizations', organizationsRoutes);
router.use('/pirs', pirsRoutes);
router.use('/sources', sourcesRoutes);
router.use('/reports', reportsRoutes);
router.use('/disseminations', disseminationsRoutes);
router.use('/metrics', metricsRoutes);
router.use('/chat', chatRoutes);

export default router;
