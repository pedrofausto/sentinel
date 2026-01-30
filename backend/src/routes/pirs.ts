import { Router, Response } from 'express';
import { query, getClient } from '../config/database';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { pirValidation, uuidParam, paginationValidation, validate } from '../middleware/validation';

const router = Router();

router.use(authenticateToken);

// GET /api/pirs
router.get(
  '/',
  paginationValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const organizationId = req.query.organizationId as string;

      let whereClause = '';
      const params: unknown[] = [limit, offset];

      if (organizationId) {
        whereClause = 'WHERE p.organization_id = $3';
        params.push(organizationId);
      }

      const { rows } = await query(
        `SELECT p.*, o.name as organization_name,
                (SELECT COUNT(*) FROM intelligence_sources WHERE pir_id = p.id) as source_count,
                (SELECT COUNT(*) FROM reports WHERE pir_id = p.id) as report_count
         FROM pirs p
         JOIN organizations o ON p.organization_id = o.id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const countQuery = organizationId
        ? 'SELECT COUNT(*) FROM pirs WHERE organization_id = $1'
        : 'SELECT COUNT(*) FROM pirs';
      const countParams = organizationId ? [organizationId] : [];
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
      console.error('Get PIRs error:', error);
      res.status(500).json({ error: 'Failed to fetch PIRs' });
    }
  }
);

// GET /api/pirs/:id
router.get(
  '/:id',
  uuidParam('id'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rows } = await query(
        `SELECT p.*, o.name as organization_name,
                (SELECT json_agg(h ORDER BY h.created_at DESC)
                 FROM pir_history h WHERE h.pir_id = p.id) as history
         FROM pirs p
         JOIN organizations o ON p.organization_id = o.id
         WHERE p.id = $1`,
        [req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'PIR not found' });
        return;
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Get PIR error:', error);
      res.status(500).json({ error: 'Failed to fetch PIR' });
    }
  }
);

// POST /api/pirs
router.post(
  '/',
  pirValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, description, priority, status, organizationId } = req.body;

      const client = await getClient();

      try {
        await client.query('BEGIN');

        const { rows } = await client.query(
          `INSERT INTO pirs (title, description, priority, status, organization_id, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [title, description, priority, status, organizationId, req.user?.id]
        );

        const pir = rows[0];

        // Create history entry
        await client.query(
          `INSERT INTO pir_history (pir_id, status, action, changed_by)
           VALUES ($1, $2, 'Created', $3)`,
          [pir.id, status, req.user?.id]
        );

        await client.query('COMMIT');
        res.status(201).json(pir);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Create PIR error:', error);
      res.status(500).json({ error: 'Failed to create PIR' });
    }
  }
);

// PUT /api/pirs/:id
router.put(
  '/:id',
  uuidParam('id'),
  pirValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, description, priority, status } = req.body;

      const client = await getClient();

      try {
        await client.query('BEGIN');

        // Get current PIR
        const { rows: current } = await client.query(
          'SELECT status FROM pirs WHERE id = $1',
          [req.params.id]
        );

        if (current.length === 0) {
          await client.query('ROLLBACK');
          res.status(404).json({ error: 'PIR not found' });
          return;
        }

        const { rows } = await client.query(
          `UPDATE pirs
           SET title = $1, description = $2, priority = $3, status = $4
           WHERE id = $5
           RETURNING *`,
          [title, description, priority, status, req.params.id]
        );

        // Create history entry
        const action = current[0].status !== status ? 'Status Changed' : 'Edited';
        await client.query(
          `INSERT INTO pir_history (pir_id, status, action, changed_by)
           VALUES ($1, $2, $3, $4)`,
          [req.params.id, status, action, req.user?.id]
        );

        await client.query('COMMIT');
        res.json(rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Update PIR error:', error);
      res.status(500).json({ error: 'Failed to update PIR' });
    }
  }
);

// DELETE /api/pirs/:id
router.delete(
  '/:id',
  uuidParam('id'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rowCount } = await query(
        'DELETE FROM pirs WHERE id = $1',
        [req.params.id]
      );

      if (rowCount === 0) {
        res.status(404).json({ error: 'PIR not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete PIR error:', error);
      res.status(500).json({ error: 'Failed to delete PIR' });
    }
  }
);

export default router;
