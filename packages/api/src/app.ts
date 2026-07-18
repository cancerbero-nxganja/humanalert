import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { globalRateLimiter } from './middleware/rateLimiter';
import healthRouter from './routes/health';
import feedbackRouter from './routes/feedback';
import alertsRouter from './routes/alerts';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '50kb' }));
  app.use(globalRateLimiter);

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/feedback', feedbackRouter);
  app.use('/api/v1/alerts', alertsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
