import { Router, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { disseminationValidation, uuidParam, paginationValidation, validate } from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

router.use(authenticateToken);

// GET /api/disseminations
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
      const status = req.query.status as string;

      let whereClause = '';
      const params: unknown[] = [limit, offset];
      const conditions: string[] = [];

      if (pirId) {
        conditions.push(`d.pir_id = $${params.length + 1}`);
        params.push(pirId);
      }

      if (status) {
        conditions.push(`d.status = $${params.length + 1}`);
        params.push(status);
      }

      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }

      const { rows } = await query(
        `SELECT d.*, p.title as pir_title, o.name as organization_name,
                r.title as linked_report_title
         FROM dissemination_logs d
         JOIN pirs p ON d.pir_id = p.id
         JOIN organizations o ON p.organization_id = o.id
         LEFT JOIN reports r ON d.report_id = r.id
         ${whereClause}
         ORDER BY d.log_date DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      let countQuery = 'SELECT COUNT(*) FROM dissemination_logs d';
      const countParams: unknown[] = [];

      if (pirId || status) {
        const countConditions: string[] = [];
        if (pirId) {
          countConditions.push(`pir_id = $${countParams.length + 1}`);
          countParams.push(pirId);
        }
        if (status) {
          countConditions.push(`status = $${countParams.length + 1}`);
          countParams.push(status);
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
      console.error('Get disseminations error:', error);
      res.status(500).json({ error: 'Failed to fetch disseminations' });
    }
  }
);

// GET /api/disseminations/:id
router.get(
  '/:id',
  uuidParam('id'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rows } = await query(
        `SELECT d.*, p.title as pir_title, o.name as organization_name,
                r.title as linked_report_title
         FROM dissemination_logs d
         JOIN pirs p ON d.pir_id = p.id
         JOIN organizations o ON p.organization_id = o.id
         LEFT JOIN reports r ON d.report_id = r.id
         WHERE d.id = $1`,
        [req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Dissemination log not found' });
        return;
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Get dissemination error:', error);
      res.status(500).json({ error: 'Failed to fetch dissemination' });
    }
  }
);

// POST /api/disseminations
router.post(
  '/',
  disseminationValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        pirId,
        reportId,
        date,
        type,
        status,
        reportName,
        deliveryChannel,
        notifiedTeam,
        observations,
        attachmentName,
        attachmentType,
        attachmentData,
      } = req.body;

      const { rows } = await query(
        `INSERT INTO dissemination_logs 
         (pir_id, report_id, log_date, type, status, report_name, delivery_channel, notified_team, observations, attachment_name, attachment_type, attachment_data, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [pirId, reportId, date || new Date(), type, status, reportName, deliveryChannel, notifiedTeam, observations, attachmentName, attachmentType, attachmentData, req.user?.id]
      );

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Create dissemination error:', error);
      res.status(500).json({ error: 'Failed to create dissemination' });
    }
  }
);

// PUT /api/disseminations/:id
router.put(
  '/:id',
  uuidParam('id'),
  disseminationValidation,
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        date,
        type,
        status,
        reportName,
        deliveryChannel,
        notifiedTeam,
        observations,
      } = req.body;

      const { rows } = await query(
        `UPDATE dissemination_logs
         SET log_date = $1, type = $2, status = $3, report_name = $4, 
             delivery_channel = $5, notified_team = $6, observations = $7
         WHERE id = $8
         RETURNING *`,
        [date, type, status, reportName, deliveryChannel, notifiedTeam, observations, req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Dissemination log not found' });
        return;
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Update dissemination error:', error);
      res.status(500).json({ error: 'Failed to update dissemination' });
    }
  }
);

// PATCH /api/disseminations/:id/status - Update status only
router.patch(
  '/:id/status',
  uuidParam('id'),
  [
    body('status')
      .isIn(['Pending', 'Disseminated', 'Acknowledged'])
      .withMessage('Invalid status'),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status } = req.body;

      const { rows } = await query(
        `UPDATE dissemination_logs SET status = $1 WHERE id = $2 RETURNING *`,
        [status, req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Dissemination log not found' });
        return;
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Update dissemination status error:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  }
);

// DELETE /api/disseminations/:id
router.delete(
  '/:id',
  uuidParam('id'),
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rowCount } = await query(
        'DELETE FROM dissemination_logs WHERE id = $1',
        [req.params.id]
      );

      if (rowCount === 0) {
        res.status(404).json({ error: 'Dissemination log not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete dissemination error:', error);
      res.status(500).json({ error: 'Failed to delete dissemination' });
    }
  }
);

export default router;
