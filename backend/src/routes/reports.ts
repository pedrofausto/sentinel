import { Router, Response } from 'express';
import { query } from '../config/database.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';
import { reportValidation, uuidParam, paginationValidation, validate } from '../middleware/validation.js';
import { analyzeReport } from '../services/gemini.js';
import { aiRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(authenticateToken);

// GET /api/reports
router.get(
  '/',
  paginationValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const pirId = req.query.pirId as string;

      let whereClause = '';
      const params: unknown[] = [limit, offset];

      if (pirId) {
        whereClause = 'WHERE r.pir_id = $3';
        params.push(pirId);
      }

      const { rows } = await query(
        `SELECT r.*, p.title as pir_title, o.name as organization_name
         FROM reports r
         JOIN pirs p ON r.pir_id = p.id
         JOIN organizations o ON p.organization_id = o.id
         ${whereClause}
         ORDER BY r.report_date DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const countQuery = pirId
        ? 'SELECT COUNT(*) FROM reports WHERE pir_id = $1'
        : 'SELECT COUNT(*) FROM reports';
      const countParams = pirId ? [pirId] : [];
      const { rows: [{ count }] } = await query(countQuery, countParams);

      res.json({
        data: rows,
        pagination: {
          page,
          limit,
          total: parseInt(count),
          pages: Math.ceil(parseInt(count) / limit),
        },
      });
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }
);

// GET /api/reports/:id
router.get(
  '/:id',
  uuidParam('id'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rows } = await query(
        `SELECT r.*, p.title as pir_title, o.name as organization_name
         FROM reports r
         JOIN pirs p ON r.pir_id = p.id
         JOIN organizations o ON p.organization_id = o.id
         WHERE r.id = $1`,
        [req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Get report error:', error);
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  }
);

// POST /api/reports
router.post(
  '/',
  reportValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, type, content, pirId, date } = req.body;

      const { rows } = await query(
        `INSERT INTO reports (title, type, content, pir_id, report_date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [title, type, content, pirId, date || new Date(), req.user?.id]
      );

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Create report error:', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  }
);

// PUT /api/reports/:id
router.put(
  '/:id',
  uuidParam('id'),
  reportValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, type, content, date } = req.body;

      const { rows } = await query(
        `UPDATE reports
         SET title = $1, type = $2, content = $3, report_date = $4
         WHERE id = $5
         RETURNING *`,
        [title, type, content, date, req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Update report error:', error);
      res.status(500).json({ error: 'Failed to update report' });
    }
  }
);

// DELETE /api/reports/:id
router.delete(
  '/:id',
  uuidParam('id'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rowCount } = await query(
        'DELETE FROM reports WHERE id = $1',
        [req.params.id]
      );

      if (rowCount === 0) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete report error:', error);
      res.status(500).json({ error: 'Failed to delete report' });
    }
  }
);

// POST /api/reports/:id/analyze - AI-powered report analysis
router.post(
  '/:id/analyze',
  uuidParam('id'),
  validate,
  aiRateLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rows } = await query(
        `SELECT r.*, p.title as pir_title
         FROM reports r
         JOIN pirs p ON r.pir_id = p.id
         WHERE r.id = $1`,
        [req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      const report = rows[0];
      const analysis = await analyzeReport(report.content, report.pir_title);

      res.json({ analysis });
    } catch (error) {
      console.error('Analyze report error:', error);
      res.status(500).json({ error: 'Failed to analyze report' });
    }
  }
);

export default router;
