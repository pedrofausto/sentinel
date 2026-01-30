import { Router, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { metricValidation, uuidParam, paginationValidation, validate } from '../middleware/validation';

const router = Router();

router.use(authenticateToken);

// GET /api/metrics
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
      const organizationId = req.query.organizationId as string;

      let whereClause = '';
      const params: unknown[] = [limit, offset];
      const conditions: string[] = [];

      if (pirId) {
        conditions.push(`m.pir_id = $${params.length + 1}`);
        params.push(pirId);
      }

      if (organizationId) {
        conditions.push(`p.organization_id = $${params.length + 1}`);
        params.push(organizationId);
      }

      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }

      const { rows } = await query(
        `SELECT m.*, p.title as pir_title, o.name as organization_name
         FROM metric_records m
         JOIN pirs p ON m.pir_id = p.id
         JOIN organizations o ON p.organization_id = o.id
         ${whereClause}
         ORDER BY m.created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      // Build count query with same conditions
      let countQuery = 'SELECT COUNT(*) FROM metric_records m JOIN pirs p ON m.pir_id = p.id';
      const countParams: unknown[] = [];

      if (pirId || organizationId) {
        const countConditions: string[] = [];
        if (pirId) {
          countConditions.push(`m.pir_id = $${countParams.length + 1}`);
          countParams.push(pirId);
        }
        if (organizationId) {
          countConditions.push(`p.organization_id = $${countParams.length + 1}`);
          countParams.push(organizationId);
        }
        countQuery += ' WHERE ' + countConditions.join(' AND ');
      }

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
      console.error('Get metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  }
);

// GET /api/metrics/stats/:organizationId - Get aggregated stats for organization
router.get(
  '/stats/:organizationId',
  uuidParam('organizationId'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rows } = await query(
        `SELECT 
           COUNT(*) as total_records,
           SUM(CASE WHEN has_incident THEN 1 ELSE 0 END) as incidents,
           SUM(CASE WHEN NOT has_incident THEN 1 ELSE 0 END) as potentials,
           SUM(CASE WHEN incident_prevented THEN 1 ELSE 0 END) as prevented,
           SUM(CASE WHEN has_incident AND NOT incident_prevented THEN 1 ELSE 0 END) as consummated,
           AVG(EXTRACT(EPOCH FROM (discovery_date - COALESCE(incident_date, discovery_date))) / 3600) as avg_mttd_hours,
           AVG(EXTRACT(EPOCH FROM (dissemination_date - discovery_date)) / 3600) as avg_mttdis_hours,
           SUM(CASE WHEN was_previously_reported THEN 1 ELSE 0 END) as previously_reported,
           COUNT(DISTINCT m.pir_id) as pirs_with_metrics
         FROM metric_records m
         JOIN pirs p ON m.pir_id = p.id
         WHERE p.organization_id = $1`,
        [req.params.organizationId]
      );

      const stats = rows[0];

      // Calculate accuracy (% of previously reported incidents)
      const total = parseInt(stats.total_records) || 1;
      const accuracy = ((parseInt(stats.previously_reported) || 0) / total * 100).toFixed(1);

      // Calculate prevention rate
      const incidents = parseInt(stats.incidents) || 1;
      const prevented = parseInt(stats.prevented) || 0;
      const preventionRate = (prevented / incidents * 100).toFixed(1);

      res.json({
        totalRecords: parseInt(stats.total_records) || 0,
        incidents: parseInt(stats.incidents) || 0,
        potentials: parseInt(stats.potentials) || 0,
        prevented: parseInt(stats.prevented) || 0,
        consummated: parseInt(stats.consummated) || 0,
        mttd: `${parseFloat(stats.avg_mttd_hours || 0).toFixed(1)}h`,
        mttdis: `${parseFloat(stats.avg_mttdis_hours || 0).toFixed(1)}h`,
        accuracy: `${accuracy}%`,
        preventionRate: `${preventionRate}%`,
        pirsWithMetrics: parseInt(stats.pirs_with_metrics) || 0,
      });
    } catch (error) {
      console.error('Get metrics stats error:', error);
      res.status(500).json({ error: 'Failed to fetch metrics stats' });
    }
  }
);

// GET /api/metrics/:id
router.get(
  '/:id',
  uuidParam('id'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rows } = await query(
        `SELECT m.*, p.title as pir_title, o.name as organization_name
         FROM metric_records m
         JOIN pirs p ON m.pir_id = p.id
         JOIN organizations o ON p.organization_id = o.id
         WHERE m.id = $1`,
        [req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Metric record not found' });
        return;
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Get metric error:', error);
      res.status(500).json({ error: 'Failed to fetch metric' });
    }
  }
);

// POST /api/metrics
router.post(
  '/',
  metricValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        pirId,
        hasIncident,
        incidentDate,
        discoveryDate,
        disseminationDate,
        wasPreviouslyReported,
        incidentPrevented,
        impactScale,
      } = req.body;

      const { rows } = await query(
        `INSERT INTO metric_records 
         (pir_id, has_incident, incident_date, discovery_date, dissemination_date, was_previously_reported, incident_prevented, impact_scale, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [pirId, hasIncident, incidentDate, discoveryDate, disseminationDate, wasPreviouslyReported, incidentPrevented, impactScale, req.user?.id]
      );

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Create metric error:', error);
      res.status(500).json({ error: 'Failed to create metric' });
    }
  }
);

// PUT /api/metrics/:id
router.put(
  '/:id',
  uuidParam('id'),
  metricValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        hasIncident,
        incidentDate,
        discoveryDate,
        disseminationDate,
        wasPreviouslyReported,
        incidentPrevented,
        impactScale,
      } = req.body;

      const { rows } = await query(
        `UPDATE metric_records
         SET has_incident = $1, incident_date = $2, discovery_date = $3, 
             dissemination_date = $4, was_previously_reported = $5, 
             incident_prevented = $6, impact_scale = $7
         WHERE id = $8
         RETURNING *`,
        [hasIncident, incidentDate, discoveryDate, disseminationDate, wasPreviouslyReported, incidentPrevented, impactScale, req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Metric record not found' });
        return;
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Update metric error:', error);
      res.status(500).json({ error: 'Failed to update metric' });
    }
  }
);

// DELETE /api/metrics/:id
router.delete(
  '/:id',
  uuidParam('id'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rowCount } = await query(
        'DELETE FROM metric_records WHERE id = $1',
        [req.params.id]
      );

      if (rowCount === 0) {
        res.status(404).json({ error: 'Metric record not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete metric error:', error);
      res.status(500).json({ error: 'Failed to delete metric' });
    }
  }
);

export default router;
