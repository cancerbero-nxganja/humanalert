import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    service: 'humanalert-api',
  });
});

export default router;
