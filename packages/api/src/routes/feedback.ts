import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { feedbackRateLimiter } from '../middleware/rateLimiter';
import { requireAdmin } from '../middleware/auth';
import { CreateFeedbackSchema } from '../validators/feedback';
import { query } from '../db';

const router = Router();

router.post('/', feedbackRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateFeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { source, context, rating, message, email, language } = parsed.data;
  const id = uuidv4();

  try {
    const result = await query(
      `INSERT INTO feedback (id, source, context, rating, message, email, language, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [id, source, context, String(rating), message ?? null, email ?? null, language]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Failed to insert feedback:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/summary', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalResult = await query(`SELECT COUNT(*) AS total FROM feedback`);
    const total = parseInt(String(totalResult.rows[0].total), 10);

    const byContextResult = await query(
      `SELECT context,
              COUNT(*) AS count,
              ROUND(AVG(CASE WHEN rating ~ '^[1-5]$' THEN rating::numeric END), 2) AS avg_rating
       FROM feedback
       GROUP BY context
       ORDER BY count DESC
       LIMIT 20`
    );

    res.json({
      total,
      by_context: byContextResult.rows.map((r) => ({
        context: String(r.context),
        count: parseInt(String(r.count), 10),
        avg_rating: r.avg_rating != null ? parseFloat(String(r.avg_rating)) : null,
      })),
    });
  } catch (err) {
    console.error('Failed to fetch feedback summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM feedback ORDER BY created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch feedback:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
