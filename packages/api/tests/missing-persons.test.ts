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

const validPayload = {
  first_name: 'Maria',
  last_name_initial: 'G',
  age_range_min: 8,
  age_range_max: 10,
  gender: 'female',
  physical_description: 'Dark hair, blue jacket',
  last_seen_at: '2026-07-20T10:00:00.000Z',
  last_seen_location: { lat: 40.7128, lon: -74.006, description: 'Near central park' },
  contact_hash: 'sha256:abc123',
  amber_alert: true,
  language: 'en',
};

const fakeRow = {
  id: 'mp-uuid-1',
  status: 'missing',
  first_name: 'Maria',
  last_name_initial: 'G',
  age_range_min: 8,
  age_range_max: 10,
  gender: 'female',
  physical_description: 'Dark hair, blue jacket',
  last_seen_at: new Date('2026-07-20T10:00:00.000Z'),
  last_seen_lat: 40.7128,
  last_seen_lon: -74.006,
  last_seen_location_desc: 'Near central park',
  photo_hash: null,
  contact_hash: 'sha256:abc123',
  amber_alert: true,
  language: 'en',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  expires_at: null,
};

describe('POST /api/v1/missing-persons', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates missing person with valid payload and admin token', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 });

    const res = await request(app)
      .post('/api/v1/missing-persons')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      first_name: 'Maria',
      last_name_initial: 'G',
      amber_alert: true,
      status: 'missing',
    });
    expect(res.body.last_seen_location).toMatchObject({ lat: 40.7128, lon: -74.006 });
    expect(mockBroadcast).toHaveBeenCalledWith('missing_person:amber_alert', expect.objectContaining({ amber_alert: true }));
  });

  it('broadcasts missing_person:new for non-AMBER cases', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...fakeRow, amber_alert: false }], rowCount: 1 });

    const res = await request(app)
      .post('/api/v1/missing-persons')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ ...validPayload, amber_alert: false });

    expect(res.status).toBe(201);
    expect(mockBroadcast).toHaveBeenCalledWith('missing_person:new', expect.any(Object));
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/v1/missing-persons').send(validPayload);
    expect(res.status).toBe(401);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin token', async () => {
    const token = jwt.sign({ sub: 'user-1', role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .post('/api/v1/missing-persons')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);
    expect(res.status).toBe(403);
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/missing-persons')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ first_name: 'Maria' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 when age_range_max < age_range_min', async () => {
    const res = await request(app)
      .post('/api/v1/missing-persons')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ ...validPayload, age_range_min: 20, age_range_max: 10 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid gender', async () => {
    const res = await request(app)
      .post('/api/v1/missing-persons')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ ...validPayload, gender: 'alien' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for last_name_initial longer than 1 char', async () => {
    const res = await request(app)
      .post('/api/v1/missing-persons')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ ...validPayload, last_name_initial: 'Garcia' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid lat', async () => {
    const res = await request(app)
      .post('/api/v1/missing-persons')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ ...validPayload, last_seen_location: { lat: 999, lon: 0 } });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/missing-persons', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns array of missing persons publicly', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 });

    const res = await request(app).get('/api/v1/missing-persons');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ first_name: 'Maria' });
  });

  it('accepts geo filter parameters', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 });

    const res = await request(app)
      .get('/api/v1/missing-persons?lat=40.7128&lon=-74.006&radius_km=20');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('accepts status filter', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).get('/api/v1/missing-persons?status=found');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('accepts amber_only filter', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 });

    const res = await request(app).get('/api/v1/missing-persons?amber_only=true');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/v1/missing-persons/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns missing person by id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 });

    const res = await request(app).get('/api/v1/missing-persons/mp-uuid-1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'mp-uuid-1', first_name: 'Maria' });
  });

  it('returns 404 for unknown id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).get('/api/v1/missing-persons/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Missing person not found');
  });
});

describe('PUT /api/v1/missing-persons/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates status to found with admin token', async () => {
    const updated = { ...fakeRow, status: 'found' };
    mockQuery.mockResolvedValueOnce({ rows: [updated], rowCount: 1 });

    const res = await request(app)
      .put('/api/v1/missing-persons/mp-uuid-1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'found' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('found');
    expect(mockBroadcast).toHaveBeenCalledWith('missing_person:found', expect.any(Object));
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .put('/api/v1/missing-persons/mp-uuid-1')
      .send({ status: 'found' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for empty update body', async () => {
    const res = await request(app)
      .put('/api/v1/missing-persons/mp-uuid-1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(app)
      .put('/api/v1/missing-persons/mp-uuid-1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'deleted' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when person not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .put('/api/v1/missing-persons/nonexistent')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ status: 'found' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/missing-persons/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('closes case with admin token', async () => {
    const closed = { ...fakeRow, status: 'case_closed' };
    mockQuery.mockResolvedValueOnce({ rows: [closed], rowCount: 1 });

    const res = await request(app)
      .delete('/api/v1/missing-persons/mp-uuid-1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Case closed');
    expect(res.body.person.status).toBe('case_closed');
    expect(mockBroadcast).toHaveBeenCalledWith('missing_person:case_closed', expect.any(Object));
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).delete('/api/v1/missing-persons/mp-uuid-1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when person not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .delete('/api/v1/missing-persons/nonexistent')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(404);
  });
});
