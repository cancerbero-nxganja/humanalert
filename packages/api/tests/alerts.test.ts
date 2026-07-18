import request from 'supertest';
import * as jwt from 'jsonwebtoken';
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
import { broadcast } from '../src/ws/broadcast';
const mockQuery = query as jest.Mock;
const mockBroadcast = broadcast as jest.Mock;

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET as string;

function adminToken(): string {
  return jwt.sign({ sub: 'admin-1', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
}

const validAlert = {
  type: 'emergency',
  severity: 'high',
  title: 'Flood warning',
  description: 'Heavy rains causing flooding in the area.',
  location: { lat: 40.7128, lon: -74.006 },
  radius_km: 10,
  language: 'en',
};

const fakeAlertRow = {
  id: 'alert-uuid-1',
  type: 'emergency',
  severity: 'high',
  status: 'active',
  title: 'Flood warning',
  description: 'Heavy rains causing flooding in the area.',
  lat: 40.7128,
  lon: -74.006,
  radius_km: 10,
  language: 'en',
  created_by: 'admin-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  expires_at: null,
};

describe('POST /api/v1/alerts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates alert with valid payload and admin token', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeAlertRow], rowCount: 1 });

    const res = await request(app)
      .post('/api/v1/alerts')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send(validAlert);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ type: 'emergency', severity: 'high', status: 'active' });
    expect(mockBroadcast).toHaveBeenCalledWith('alert:new', expect.objectContaining({ type: 'emergency' }));
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/v1/alerts').send(validAlert);
    expect(res.status).toBe(401);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin token', async () => {
    const userToken = jwt.sign({ sub: 'user-1', role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .post('/api/v1/alerts')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validAlert);
    expect(res.status).toBe(403);
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/alerts')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ type: 'emergency' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 for invalid severity', async () => {
    const res = await request(app)
      .post('/api/v1/alerts')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ ...validAlert, severity: 'extreme' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for lat out of range', async () => {
    const res = await request(app)
      .post('/api/v1/alerts')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ ...validAlert, location: { lat: 91, lon: 0 } });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/alerts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns array of active alerts publicly', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeAlertRow], rowCount: 1 });

    const res = await request(app).get('/api/v1/alerts');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('accepts geo filter parameters', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeAlertRow], rowCount: 1 });

    const res = await request(app)
      .get('/api/v1/alerts?lat=40.7128&lon=-74.006&radius_km=20');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('accepts status filter', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).get('/api/v1/alerts?status=resolved');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/v1/alerts/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns alert by id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeAlertRow], rowCount: 1 });

    const res = await request(app).get('/api/v1/alerts/alert-uuid-1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'alert-uuid-1', type: 'emergency' });
  });

  it('returns 404 for unknown id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).get('/api/v1/alerts/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Alert not found');
  });
});

describe('PUT /api/v1/alerts/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates alert with admin token', async () => {
    const updated = { ...fakeAlertRow, severity: 'critical' };
    mockQuery.mockResolvedValueOnce({ rows: [updated], rowCount: 1 });

    const res = await request(app)
      .put('/api/v1/alerts/alert-uuid-1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ severity: 'critical' });

    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('critical');
    expect(mockBroadcast).toHaveBeenCalledWith('alert:updated', expect.objectContaining({ severity: 'critical' }));
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .put('/api/v1/alerts/alert-uuid-1')
      .send({ severity: 'critical' });
    expect(res.status).toBe(401);
  });

  it('returns 404 when alert not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .put('/api/v1/alerts/nonexistent')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ severity: 'critical' });

    expect(res.status).toBe(404);
  });

  it('returns 400 for empty update body', async () => {
    const res = await request(app)
      .put('/api/v1/alerts/alert-uuid-1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid status value', async () => {
    const res = await request(app)
      .put('/api/v1/alerts/alert-uuid-1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'deleted' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/alerts/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolves alert with admin token', async () => {
    const resolved = { ...fakeAlertRow, status: 'resolved' };
    mockQuery.mockResolvedValueOnce({ rows: [resolved], rowCount: 1 });

    const res = await request(app)
      .delete('/api/v1/alerts/alert-uuid-1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Alert resolved');
    expect(res.body.alert.status).toBe('resolved');
    expect(mockBroadcast).toHaveBeenCalledWith('alert:resolved', expect.objectContaining({ status: 'resolved' }));
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).delete('/api/v1/alerts/alert-uuid-1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when alert not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .delete('/api/v1/alerts/nonexistent')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(404);
  });
});
