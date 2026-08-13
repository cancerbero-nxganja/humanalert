import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { globalRateLimiter } from './middleware/rateLimiter';
import healthRouter from './routes/health';
import feedbackRouter from './routes/feedback';
import alertsRouter from './routes/alerts';
import missingPersonsRouter from './routes/missing-persons';
import animalAlertsRouter from './routes/animal-alerts';
import mapPinsRouter from './routes/map-pins';

function buildCorsOptions(): cors.CorsOptions {
  const raw = process.env.CORS_ORIGINS ?? '';
  if (!raw || raw === '*') {
    return { origin: '*' };
  }
  const allowed = new Set(raw.split(',').map(o => o.trim()).filter(Boolean));
  return {
    origin: (origin, callback) => {
      if (!origin || allowed.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  };
}

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: '50kb' }));
  app.use(globalRateLimiter);

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/feedback', feedbackRouter);
  app.use('/api/v1/alerts', alertsRouter);
  app.use('/api/v1/missing-persons', missingPersonsRouter);
  app.use('/api/v1/animal-alerts', animalAlertsRouter);
  app.use('/api/v1/map-pins', mapPinsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
