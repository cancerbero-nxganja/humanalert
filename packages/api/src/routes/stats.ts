import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/v1/stats — public, no auth required
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [alerts, missingPersons, animalAlerts, mapPins] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) AS count FROM alerts WHERE status = 'active'`),
      query<{ count: string }>(`SELECT COUNT(*) AS count FROM missing_persons WHERE status = 'missing'`),
      query<{ count: string }>(`SELECT COUNT(*) AS count FROM animal_alerts WHERE status = 'LOST'`),
      query<{ count: string }>(`SELECT COUNT(*) AS count FROM map_pins WHERE (expires_at IS NULL OR expires_at > NOW())`),
    ]);

    res.json({
      active_alerts: parseInt(alerts.rows[0].count, 10),
      missing_persons: parseInt(missingPersons.rows[0].count, 10),
      lost_animals: parseInt(animalAlerts.rows[0].count, 10),
      active_map_pins: parseInt(mapPins.rows[0].count, 10),
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to fetch stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
