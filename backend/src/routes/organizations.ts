import { Router, Response } from 'express';
import { query } from '../config/database.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';
import { organizationValidation, uuidParam, paginationValidation, validate } from '../middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/organizations
router.get(
  '/',
  paginationValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const { rows } = await query(
        `SELECT o.*, u.username as created_by_name,
                (SELECT COUNT(*) FROM pirs WHERE organization_id = o.id) as pir_count
         FROM organizations o
         LEFT JOIN users u ON o.created_by = u.id
         ORDER BY o.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const { rows: [{ count }] } = await query('SELECT COUNT(*) FROM organizations');

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
      console.error('Get organizations error:', error);
      res.status(500).json({ error: 'Failed to fetch organizations' });
    }
  }
);

// GET /api/organizations/:id
router.get(
  '/:id',
  uuidParam('id'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rows } = await query(
        `SELECT o.*, u.username as created_by_name
         FROM organizations o
         LEFT JOIN users u ON o.created_by = u.id
         WHERE o.id = $1`,
        [req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      // Get related data counts
      const org = rows[0];
      const { rows: [counts] } = await query(
        `SELECT 
           (SELECT COUNT(*) FROM pirs WHERE organization_id = $1) as pirs,
           (SELECT COUNT(*) FROM intelligence_sources s JOIN pirs p ON s.pir_id = p.id WHERE p.organization_id = $1) as sources,
           (SELECT COUNT(*) FROM reports r JOIN pirs p ON r.pir_id = p.id WHERE p.organization_id = $1) as reports,
           (SELECT COUNT(*) FROM dissemination_logs d JOIN pirs p ON d.pir_id = p.id WHERE p.organization_id = $1) as disseminations,
           (SELECT COUNT(*) FROM metric_records m JOIN pirs p ON m.pir_id = p.id WHERE p.organization_id = $1) as metrics`,
        [req.params.id]
      );

      res.json({ ...org, counts });
    } catch (error) {
      console.error('Get organization error:', error);
      res.status(500).json({ error: 'Failed to fetch organization' });
    }
  }
);

// POST /api/organizations
router.post(
  '/',
  organizationValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, sector, description, stakeholderName, stakeholderEmail } = req.body;

      const { rows } = await query(
        `INSERT INTO organizations (name, sector, description, stakeholder_name, stakeholder_email, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, sector, description, stakeholderName, stakeholderEmail, req.user?.id]
      );

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Create organization error:', error);
      res.status(500).json({ error: 'Failed to create organization' });
    }
  }
);

// PUT /api/organizations/:id
router.put(
  '/:id',
  uuidParam('id'),
  organizationValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, sector, description, stakeholderName, stakeholderEmail } = req.body;

      const { rows } = await query(
        `UPDATE organizations
         SET name = $1, sector = $2, description = $3, stakeholder_name = $4, stakeholder_email = $5
         WHERE id = $6
         RETURNING *`,
        [name, sector, description, stakeholderName, stakeholderEmail, req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Update organization error:', error);
      res.status(500).json({ error: 'Failed to update organization' });
    }
  }
);

// DELETE /api/organizations/:id
router.delete(
  '/:id',
  uuidParam('id'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rowCount } = await query(
        'DELETE FROM organizations WHERE id = $1',
        [req.params.id]
      );

      if (rowCount === 0) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete organization error:', error);
      res.status(500).json({ error: 'Failed to delete organization' });
    }
  }
);

// GET /api/organizations/:id/full - Get organization with all related data
router.get(
  '/:id/full',
  uuidParam('id'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Get organization
      const { rows: orgs } = await query(
        'SELECT * FROM organizations WHERE id = $1',
        [req.params.id]
      );

      if (orgs.length === 0) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      const org = orgs[0];

      // Get PIRs
      const { rows: pirs } = await query(
        `SELECT p.*, 
                (SELECT json_agg(h ORDER BY h.created_at DESC)
                 FROM pir_history h WHERE h.pir_id = p.id) as history
         FROM pirs p WHERE p.organization_id = $1
         ORDER BY p.created_at DESC`,
        [req.params.id]
      );

      // Get sources, reports, disseminations, and metrics for each PIR
      for (const pir of pirs) {
        const { rows: sources } = await query(
          'SELECT * FROM intelligence_sources WHERE pir_id = $1 ORDER BY integration_date DESC',
          [pir.id]
        );
        pir.sources = sources;

        const { rows: reports } = await query(
          'SELECT * FROM reports WHERE pir_id = $1 ORDER BY report_date DESC',
          [pir.id]
        );
        pir.reports = reports;

        const { rows: disseminations } = await query(
          'SELECT * FROM dissemination_logs WHERE pir_id = $1 ORDER BY log_date DESC',
          [pir.id]
        );
        pir.disseminations = disseminations;

        const { rows: metrics } = await query(
          'SELECT * FROM metric_records WHERE pir_id = $1 ORDER BY created_at DESC',
          [pir.id]
        );
        pir.metrics = metrics;
      }

      res.json({
        ...org,
        phases: {
          planning: {
            pirs: pirs.map(p => ({
              id: p.id,
              title: p.title,
              description: p.description,
              priority: p.priority,
              status: p.status,
              history: p.history || [],
            })),
          },
          collection: {
            sources: pirs.flatMap(p => p.sources || []),
          },
          analysis: {
            reports: pirs.flatMap(p => p.reports || []),
          },
          dissemination: {
            logs: pirs.flatMap(p => p.disseminations || []),
          },
        },
        metrics: pirs.flatMap(p => p.metrics || []),
      });
    } catch (error) {
      console.error('Get full organization error:', error);
      res.status(500).json({ error: 'Failed to fetch organization data' });
    }
  }
);

export default router;
