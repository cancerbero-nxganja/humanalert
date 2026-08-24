import { Router, Request, Response } from 'express';
import { query } from '../db';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../../package.json') as { version: string };

const router = Router();

// Liveness probe — process is up, event loop responds.
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'ok',
    version: pkg.version,
    timestamp: new Date().toISOString(),
    service: 'humanalert-api',
  });
});

// Readiness probe — dependencies (DB) are reachable so we can serve real traffic.
router.get('/ready', async (_req: Request, res: Response): Promise<void> => {
  try {
    await query('SELECT 1');
    res.json({
      status: 'ready',
      version: pkg.version,
      timestamp: new Date().toISOString(),
      service: 'humanalert-api',
      checks: { database: 'ok' },
    });
  } catch (err) {
    console.error('Readiness probe failed:', err);
    res.status(503).json({
      status: 'not_ready',
      version: pkg.version,
      timestamp: new Date().toISOString(),
      service: 'humanalert-api',
      checks: { database: 'error' },
    });
  }
});

export default router;
