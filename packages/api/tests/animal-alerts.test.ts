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
import { broadcast } from '../src/ws/broadcast';

const mockQuery = query as jest.Mock;
const mockBroadcast = broadcast as jest.Mock;

const app = createApp();

const validPayload = {
  species: 'dog',
  name: 'Max',
  photo_url: 'https://example.com/max.jpg',
  last_seen_lat: 40.7128,
  last_seen_lon: -74.006,
  contact_hash: 'sha256:abc123def456',
  status: 'LOST',
  description: 'Golden retriever, friendly',
  language: 'en',
};

const fakeRow = {
  id: 'animal-uuid-1',
  species: 'dog',
  name: 'Max',
  photo_url: 'https://example.com/max.jpg',
  last_seen_lat: 40.7128,
  last_seen_lon: -74.006,
  contact_hash: 'sha256:abc123def456',
  status: 'LOST',
  description: 'Golden retriever, friendly',
  language: 'en',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  expires_at: null,
};

describe('POST /api/v1/animal-alerts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates animal alert with valid payload (no auth required)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 });

    const res = await request(app)
      .post('/api/v1/animal-alerts')
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ species: 'dog', name: 'Max', status: 'LOST' });
    expect(mockBroadcast).toHaveBeenCalledWith('animal-alert:new', expect.objectContaining({ species: 'dog' }));
  });

  it('creates alert without optional fields', async () => {
    const minimal = {
      species: 'cat',
      last_seen_lat: 48.8566,
      last_seen_lon: 2.3522,
      contact_hash: 'sha256:xyz789',
    };
    mockQuery.mockResolvedValueOnce({ rows: [{ ...fakeRow, ...minimal, name: null, photo_url: null }], rowCount: 1 });

    const res = await request(app)
      .post('/api/v1/animal-alerts')
      .send(minimal);

    expect(res.status).toBe(201);
    expect(res.body.species).toBe('cat');
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/animal-alerts')
      .send({ species: 'dog' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 for invalid species', async () => {
    const res = await request(app)
      .post('/api/v1/animal-alerts')
      .send({ ...validPayload, species: 'dragon' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(app)
      .post('/api/v1/animal-alerts')
      .send({ ...validPayload, status: 'MISSING' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for lat out of range', async () => {
    const res = await request(app)
      .post('/api/v1/animal-alerts')
      .send({ ...validPayload, last_seen_lat: 95 });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid photo_url', async () => {
    const res = await request(app)
      .post('/api/v1/animal-alerts')
      .send({ ...validPayload, photo_url: 'not-a-url' });

    expect(res.status).toBe(400);
  });

  it('returns 500 on db error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app)
      .post('/api/v1/animal-alerts')
      .send(validPayload);

    expect(res.status).toBe(500);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/animal-alerts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns array of LOST alerts publicly (no auth)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 });

    const res = await request(app).get('/api/v1/animal-alerts');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('accepts geo filter parameters', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 });

    const res = await request(app)
      .get('/api/v1/animal-alerts?lat=40.7128&lon=-74.006&radius_km=10');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('accepts status filter for FOUND', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .get('/api/v1/animal-alerts?status=FOUND');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('accepts status filter for REUNITED', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .get('/api/v1/animal-alerts?status=REUNITED');

    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid geo param', async () => {
    const res = await request(app)
      .get('/api/v1/animal-alerts?lat=999&lon=0&radius_km=5');

    expect(res.status).toBe(400);
  });

  it('returns 500 on db error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/v1/animal-alerts');

    expect(res.status).toBe(500);
  });
});

describe('GET /api/v1/animal-alerts/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns animal alert by id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 });

    const res = await request(app).get('/api/v1/animal-alerts/animal-uuid-1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'animal-uuid-1', species: 'dog' });
  });

  it('returns 404 for unknown id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).get('/api/v1/animal-alerts/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Animal alert not found');
  });
});

describe('PATCH /api/v1/animal-alerts/:id/status', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates status with valid contact_hash', async () => {
    const updatedRow = { ...fakeRow, status: 'REUNITED' };
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [updatedRow], rowCount: 1 });

    const res = await request(app)
      .patch('/api/v1/animal-alerts/animal-uuid-1/status')
      .send({ status: 'REUNITED', contact_hash: 'sha256:abc123def456' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REUNITED');
    expect(mockBroadcast).toHaveBeenCalledWith('animal-alert:updated', expect.objectContaining({ status: 'REUNITED' }));
  });

  it('returns 400 when contact_hash is missing', async () => {
    const res = await request(app)
      .patch('/api/v1/animal-alerts/animal-uuid-1/status')
      .send({ status: 'FOUND' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/contact_hash/i);
  });

  it('returns 403 when contact_hash does not match', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 });

    const res = await request(app)
      .patch('/api/v1/animal-alerts/animal-uuid-1/status')
      .send({ status: 'FOUND', contact_hash: 'wrong-hash' });

    expect(res.status).toBe(403);
  });

  it('returns 404 for unknown alert', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .patch('/api/v1/animal-alerts/nonexistent/status')
      .send({ status: 'FOUND', contact_hash: 'sha256:abc123def456' });

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid status value', async () => {
    const res = await request(app)
      .patch('/api/v1/animal-alerts/animal-uuid-1/status')
      .send({ status: 'MISSING', contact_hash: 'sha256:abc123def456' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for empty update body', async () => {
    const res = await request(app)
      .patch('/api/v1/animal-alerts/animal-uuid-1/status')
      .send({ contact_hash: 'sha256:abc123def456' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No fields to update');
  });
});
