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
import * as jwt from 'jsonwebtoken';

const mockQuery = query as jest.Mock;
const mockBroadcast = broadcast as jest.Mock;

const app = createApp();

function makeAdminToken(): string {
  return jwt.sign({ sub: 'admin1', role: 'admin' }, process.env.JWT_SECRET ?? 'test-secret-for-jest', { expiresIn: '1h' });
}

const fakePin = {
  id: 'pin-uuid-1',
  category: 'shelter',
  title: 'Emergency shelter downtown',
  description: 'Capacity 200 people, open 24h',
  lat: 40.7128,
  lon: -74.006,
  verified: false,
  upvotes: 0,
  language: 'en',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  expires_at: null,
};

describe('POST /api/v1/map-pins', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates map pin with valid payload (no auth required)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakePin], rowCount: 1 });

    const res = await request(app)
      .post('/api/v1/map-pins')
      .send({
        category: 'shelter',
        title: 'Emergency shelter downtown',
        description: 'Capacity 200 people, open 24h',
        lat: 40.7128,
        lon: -74.006,
        language: 'en',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ category: 'shelter', title: 'Emergency shelter downtown' });
    expect(mockBroadcast).toHaveBeenCalledWith('map-pin:new', expect.objectContaining({ category: 'shelter' }));
  });

  it('creates map pin without optional description', async () => {
    const minimal = { ...fakePin, category: 'water', description: null };
    mockQuery.mockResolvedValueOnce({ rows: [minimal], rowCount: 1 });

    const res = await request(app)
      .post('/api/v1/map-pins')
      .send({ category: 'water', title: 'Water distribution point', lat: 48.8566, lon: 2.3522 });

    expect(res.status).toBe(201);
    expect(res.body.category).toBe('water');
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/map-pins')
      .send({ category: 'shelter' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 for invalid category', async () => {
    const res = await request(app)
      .post('/api/v1/map-pins')
      .send({ category: 'invalid_cat', title: 'Test', lat: 0, lon: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 for lat out of range', async () => {
    const res = await request(app)
      .post('/api/v1/map-pins')
      .send({ category: 'food', title: 'Food', lat: 95, lon: 0 });

    expect(res.status).toBe(400);
  });

  it('returns 400 for lon out of range', async () => {
    const res = await request(app)
      .post('/api/v1/map-pins')
      .send({ category: 'food', title: 'Food', lat: 0, lon: 200 });

    expect(res.status).toBe(400);
  });

  it('returns 500 on db error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app)
      .post('/api/v1/map-pins')
      .send({ category: 'shelter', title: 'Test shelter', lat: 0, lon: 0, language: 'en' });

    expect(res.status).toBe(500);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/map-pins', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns array of map pins publicly (no auth)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakePin], rowCount: 1 });

    const res = await request(app).get('/api/v1/map-pins');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('accepts geo filter parameters', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakePin], rowCount: 1 });

    const res = await request(app)
      .get('/api/v1/map-pins?lat=40.7128&lon=-74.006&radius_km=10');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('accepts category filter', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakePin], rowCount: 1 });

    const res = await request(app).get('/api/v1/map-pins?category=shelter');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('includes animal_alerts layer when include_animal_alerts=true', async () => {
    const animalRow = { id: 'aa-1', species: 'dog', status: 'LOST', _type: 'animal_alert' };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...fakePin, _type: 'map_pin' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [animalRow], rowCount: 1 });

    const res = await request(app).get('/api/v1/map-pins?include_animal_alerts=true');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const types = res.body.map((r: Record<string, unknown>) => r._type);
    expect(types).toContain('animal_alert');
  });

  it('combines geo + include_animal_alerts layer', async () => {
    const animalRow = { id: 'aa-2', species: 'cat', status: 'LOST', _type: 'animal_alert' };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...fakePin, _type: 'map_pin' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [animalRow], rowCount: 1 });

    const res = await request(app)
      .get('/api/v1/map-pins?lat=40.7128&lon=-74.006&radius_km=5&include_animal_alerts=true');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 400 for invalid geo param', async () => {
    const res = await request(app)
      .get('/api/v1/map-pins?lat=999&lon=0&radius_km=5');

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid category param', async () => {
    const res = await request(app)
      .get('/api/v1/map-pins?category=invalid');

    expect(res.status).toBe(400);
  });

  it('returns 500 on db error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/v1/map-pins');

    expect(res.status).toBe(500);
  });
});

describe('GET /api/v1/map-pins/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns map pin by id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakePin], rowCount: 1 });

    const res = await request(app).get('/api/v1/map-pins/pin-uuid-1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'pin-uuid-1', category: 'shelter' });
  });

  it('returns 404 for unknown id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).get('/api/v1/map-pins/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Map pin not found');
  });

  it('returns 500 on db error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/v1/map-pins/pin-uuid-1');

    expect(res.status).toBe(500);
  });
});

describe('PUT /api/v1/map-pins/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .put('/api/v1/map-pins/pin-uuid-1')
      .send({ title: 'Updated title' });

    expect(res.status).toBe(401);
  });

  it('updates map pin with valid admin token', async () => {
    const updatedPin = { ...fakePin, title: 'Updated title', verified: true };
    mockQuery.mockResolvedValueOnce({ rows: [updatedPin], rowCount: 1 });

    const res = await request(app)
      .put('/api/v1/map-pins/pin-uuid-1')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ title: 'Updated title', verified: true });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated title');
    expect(res.body.verified).toBe(true);
    expect(mockBroadcast).toHaveBeenCalledWith('map-pin:updated', expect.objectContaining({ title: 'Updated title' }));
  });

  it('returns 400 for empty update body', async () => {
    const res = await request(app)
      .put('/api/v1/map-pins/pin-uuid-1')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No fields to update');
  });

  it('returns 400 for invalid category on update', async () => {
    const res = await request(app)
      .put('/api/v1/map-pins/pin-uuid-1')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ category: 'invalid' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when pin not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .put('/api/v1/map-pins/nonexistent')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ title: 'New title' });

    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/map-pins/:id/upvote', () => {
  beforeEach(() => jest.clearAllMocks());

  it('increments upvote count (no auth required)', async () => {
    const upvotedPin = { ...fakePin, upvotes: 1 };
    mockQuery.mockResolvedValueOnce({ rows: [upvotedPin], rowCount: 1 });

    const res = await request(app).post('/api/v1/map-pins/pin-uuid-1/upvote');

    expect(res.status).toBe(200);
    expect(res.body.upvotes).toBe(1);
    expect(mockBroadcast).toHaveBeenCalledWith('map-pin:upvoted', { id: 'pin-uuid-1', upvotes: 1 });
  });

  it('returns 404 for unknown pin', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).post('/api/v1/map-pins/nonexistent/upvote');

    expect(res.status).toBe(404);
  });

  it('returns 500 on db error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).post('/api/v1/map-pins/pin-uuid-1/upvote');

    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/v1/map-pins/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app).delete('/api/v1/map-pins/pin-uuid-1');

    expect(res.status).toBe(401);
  });

  it('soft-deletes map pin with admin token', async () => {
    const expiredPin = { ...fakePin, expires_at: new Date().toISOString() };
    mockQuery.mockResolvedValueOnce({ rows: [expiredPin], rowCount: 1 });

    const res = await request(app)
      .delete('/api/v1/map-pins/pin-uuid-1')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Map pin removed');
    expect(mockBroadcast).toHaveBeenCalledWith('map-pin:removed', { id: 'pin-uuid-1' });
  });

  it('returns 404 when pin not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .delete('/api/v1/map-pins/nonexistent')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(404);
  });

  it('returns 500 on db error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .delete('/api/v1/map-pins/pin-uuid-1')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(500);
  });
});
