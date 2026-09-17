import request from 'supertest';
import { createApp } from '../src/app';

jest.mock('../src/db', () => ({
  query: jest.fn(),
  getPool: jest.fn(),
  closePool: jest.fn(),
}));

jest.mock('../src/ws/broadcast', () => ({
  broadcast: jest.fn(),
  attachWsServer: jest.fn(),
  getQueuedEvents: jest.fn(() => []),
  clearQueue: jest.fn(),
  getConnectedCount: jest.fn(() => 0),
}));

import { query } from '../src/db';
const mockQuery = query as jest.Mock;

const app = createApp();

describe('GET /api/v1/stats', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns counts for all entity types without auth', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '12' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: '5' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: '8' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: '31' }], rowCount: 1 });

    const res = await request(app).get('/api/v1/stats');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      active_alerts: 12,
      missing_persons: 5,
      lost_animals: 8,
      active_map_pins: 31,
    });
    expect(typeof res.body.generated_at).toBe('string');
  });

  it('runs 4 parallel queries', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 });

    await request(app).get('/api/v1/stats');

    expect(mockQuery).toHaveBeenCalledTimes(4);
  });

  it('returns 500 when a query fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/v1/stats');

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ error: 'Internal server error' });
  });
});
