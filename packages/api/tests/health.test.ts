import request from 'supertest';
import { createApp } from '../src/app';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../package.json') as { version: string };

jest.mock('../src/db', () => ({
  query: jest.fn(),
  getPool: jest.fn(),
  closePool: jest.fn(),
}));

import { query } from '../src/db';
const mockQuery = query as jest.Mock;

const app = createApp();

describe('GET /api/v1/health', () => {
  it('returns liveness payload with dynamic version from package.json', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'humanalert-api',
      version: pkg.version,
    });
    expect(typeof res.body.timestamp).toBe('string');
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('reports a version that matches the API package.json (no drift)', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.body.version).toBe(pkg.version);
    expect(res.body.version).not.toBe('0.1.0');
  });
});

describe('GET /api/v1/health/ready', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with database:ok when the DB responds', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 });

    const res = await request(app).get('/api/v1/health/ready');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ready',
      service: 'humanalert-api',
      version: pkg.version,
      checks: { database: 'ok' },
    });
    expect(mockQuery).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns 503 with database:error when the DB probe throws', async () => {
    mockQuery.mockRejectedValueOnce(new Error('connection refused'));

    const res = await request(app).get('/api/v1/health/ready');

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      status: 'not_ready',
      service: 'humanalert-api',
      version: pkg.version,
      checks: { database: 'error' },
    });
  });

  it('includes a valid ISO timestamp in the not-ready payload', async () => {
    mockQuery.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app).get('/api/v1/health/ready');

    expect(res.status).toBe(503);
    expect(typeof res.body.timestamp).toBe('string');
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });
});
