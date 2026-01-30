import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { generateCTIInsight, getCTIChatResponse } from '../services/gemini';
import { aiRateLimiter } from '../middleware/rateLimit';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { query } from '../config/database';

const router = Router();

router.use(authenticateToken);

// POST /api/chat/insight - Generate a one-shot CTI insight
router.post(
  '/insight',
  aiRateLimiter,
  [
    body('prompt')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Prompt must be between 10 and 2000 characters'),
    body('organizationId')
      .optional()
      .isUUID()
      .withMessage('Valid organization ID required'),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { prompt, organizationId } = req.body;

      let context = 'Contexto geral do programa de CTI.';

      if (organizationId) {
        // Fetch organization context
        const { rows: orgs } = await query(
          `SELECT o.*, 
                  (SELECT COUNT(*) FROM pirs WHERE organization_id = o.id) as pir_count,
                  (SELECT COUNT(*) FROM pirs p JOIN intelligence_sources s ON s.pir_id = p.id WHERE p.organization_id = o.id) as source_count
           FROM organizations o WHERE o.id = $1`,
          [organizationId]
        );

        if (orgs.length > 0) {
          const org = orgs[0];
          context = `Organização: ${org.name}
Setor: ${org.sector}
${org.description ? `Descrição: ${org.description}` : ''}
PIRs cadastrados: ${org.pir_count}
Fontes de inteligência: ${org.source_count}`;
        }
      }

      const insight = await generateCTIInsight(prompt, context);
      res.json({ insight });
    } catch (error) {
      console.error('Generate insight error:', error);
      res.status(500).json({ error: 'Failed to generate insight' });
    }
  }
);

// POST /api/chat/message - Chat conversation with context
router.post(
  '/message',
  aiRateLimiter,
  [
    body('message')
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message must be between 1 and 2000 characters'),
    body('history')
      .optional()
      .isArray()
      .withMessage('History must be an array'),
    body('organizationId')
      .optional()
      .isUUID()
      .withMessage('Valid organization ID required'),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { message, history = [], organizationId } = req.body;

      let context = 'Contexto geral do programa de CTI.';

      if (organizationId) {
        // Fetch full organization context for chat
        const { rows: orgs } = await query(
          'SELECT * FROM organizations WHERE id = $1',
          [organizationId]
        );

        if (orgs.length > 0) {
          const org = orgs[0];

          // Get PIRs
          const { rows: pirs } = await query(
            'SELECT title, priority, status FROM pirs WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 10',
            [organizationId]
          );

          // Get recent reports
          const { rows: reports } = await query(
            `SELECT r.title, r.type 
             FROM reports r 
             JOIN pirs p ON r.pir_id = p.id 
             WHERE p.organization_id = $1 
             ORDER BY r.created_at DESC LIMIT 5`,
            [organizationId]
          );

          // Get sources summary
          const { rows: [sourcesSummary] } = await query(
            `SELECT 
               COUNT(*) as total,
               COUNT(CASE WHEN type = 'OSINT' THEN 1 END) as osint,
               COUNT(CASE WHEN type = 'Internal' THEN 1 END) as internal,
               COUNT(CASE WHEN type = 'DarkWeb' THEN 1 END) as darkweb
             FROM intelligence_sources s
             JOIN pirs p ON s.pir_id = p.id
             WHERE p.organization_id = $1`,
            [organizationId]
          );

          context = `Organização: ${org.name}
Setor: ${org.sector}
${org.description ? `Descrição: ${org.description}` : ''}
Stakeholder: ${org.stakeholder_name || 'Não definido'} (${org.stakeholder_email || 'sem email'})

PIRs Ativos (últimos 10):
${pirs.length > 0 ? pirs.map(p => `- ${p.title} [${p.priority}] - ${p.status}`).join('\n') : 'Nenhum PIR cadastrado'}

Relatórios Recentes:
${reports.length > 0 ? reports.map(r => `- ${r.title} (${r.type})`).join('\n') : 'Nenhum relatório'}

Fontes de Inteligência:
Total: ${sourcesSummary?.total || 0} | OSINT: ${sourcesSummary?.osint || 0} | Interno: ${sourcesSummary?.internal || 0} | Dark Web: ${sourcesSummary?.darkweb || 0}`;
        }
      }

      // Convert history to expected format
      const formattedHistory = history.map((h: { role: string; content: string }) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: h.content,
      }));

      const response = await getCTIChatResponse(formattedHistory, message, context);
      res.json({ response });
    } catch (error) {
      console.error('Chat message error:', error);
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  }
);

export default router;
