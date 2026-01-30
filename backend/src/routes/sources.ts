import { Router, Response } from 'express';
import { query } from '../config/database.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';
import { sourceValidation, uuidParam, paginationValidation, validate } from '../middleware/validation.js';

const router = Router();

router.use(authenticateToken);

// GET /api/sources
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
        whereClause = 'WHERE s.pir_id = $3';
        params.push(pirId);
      }

      const { rows } = await query(
        `SELECT s.*, p.title as pir_title, o.name as organization_name
         FROM intelligence_sources s
         JOIN pirs p ON s.pir_id = p.id
         JOIN organizations o ON p.organization_id = o.id
         ${whereClause}
         ORDER BY s.integration_date DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const countQuery = pirId
        ? 'SELECT COUNT(*) FROM intelligence_sources WHERE pir_id = $1'
        : 'SELECT COUNT(*) FROM intelligence_sources';
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
      console.error('Get sources error:', error);
      res.status(500).json({ error: 'Failed to fetch sources' });
    }
  }
);

// GET /api/sources/:id
router.get(
  '/:id',
  uuidParam('id'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rows } = await query(
        `SELECT s.*, p.title as pir_title, o.name as organization_name
         FROM intelligence_sources s
         JOIN pirs p ON s.pir_id = p.id
         JOIN organizations o ON p.organization_id = o.id
         WHERE s.id = $1`,
        [req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Source not found' });
        return;
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Get source error:', error);
      res.status(500).json({ error: 'Failed to fetch source' });
    }
  }
);

// POST /api/sources
router.post(
  '/',
  sourceValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, description, type, credibility, reliability, pirId, integrationDate } = req.body;

      const { rows } = await query(
        `INSERT INTO intelligence_sources (name, description, type, credibility, reliability, pir_id, integration_date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [name, description, type, credibility, reliability, pirId, integrationDate || new Date(), req.user?.id]
      );

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Create source error:', error);
      res.status(500).json({ error: 'Failed to create source' });
    }
  }
);

// PUT /api/sources/:id
router.put(
  '/:id',
  uuidParam('id'),
  sourceValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, description, type, credibility, reliability, integrationDate } = req.body;

      const { rows } = await query(
        `UPDATE intelligence_sources
         SET name = $1, description = $2, type = $3, credibility = $4, reliability = $5, integration_date = $6
         WHERE id = $7
         RETURNING *`,
        [name, description, type, credibility, reliability, integrationDate, req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Source not found' });
        return;
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Update source error:', error);
      res.status(500).json({ error: 'Failed to update source' });
    }
  }
);

// DELETE /api/sources/:id
router.delete(
  '/:id',
  uuidParam('id'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rowCount } = await query(
        'DELETE FROM intelligence_sources WHERE id = $1',
        [req.params.id]
      );

      if (rowCount === 0) {
        res.status(404).json({ error: 'Source not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete source error:', error);
      res.status(500).json({ error: 'Failed to delete source' });
    }
  }
);

export default router;
