import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { createApp } from '../src/app';

// Mock the DB module so tests run without a real Postgres instance
jest.mock('../src/db', () => ({
  query: jest.fn(),
  getPool: jest.fn(),
  closePool: jest.fn(),
}));

import { query } from '../src/db';
const mockQuery = query as jest.Mock;

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET as string;

function makeAdminToken(): string {
  return jwt.sign({ sub: 'admin-1', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
}

const validFeedbackPayload = {
  source: 'web',
  context: 'home_page',
  rating: 4,
  message: 'Great app, very helpful!',
  language: 'en',
};

describe('POST /api/v1/feedback', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates feedback with valid payload', async () => {
    const fakeRow = {
      id: 'uuid-1',
      source: 'web',
      context: 'home_page',
      rating: '4',
      message: 'Great app, very helpful!',
      email: null,
      language: 'en',
      created_at: new Date().toISOString(),
    };
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 });

    const res = await request(app)
      .post('/api/v1/feedback')
      .send(validFeedbackPayload)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ source: 'web', context: 'home_page' });
  });

  it('accepts thumbs-up rating', async () => {
    const fakeRow = { id: 'uuid-2', source: 'app', context: 'alert_sent', rating: 'thumbs-up', language: 'es', created_at: new Date().toISOString() };
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 });

    const res = await request(app)
      .post('/api/v1/feedback')
      .send({ source: 'app', context: 'alert_sent', rating: 'thumbs-up', language: 'es' });

    expect(res.status).toBe(201);
    expect(res.body.rating).toBe('thumbs-up');
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/feedback')
      .send({ source: 'web' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });

  it('returns 400 for invalid source value', async () => {
    const res = await request(app)
      .post('/api/v1/feedback')
      .send({ ...validFeedbackPayload, source: 'kiosk' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 for rating out of range', async () => {
    const res = await request(app)
      .post('/api/v1/feedback')
      .send({ ...validFeedbackPayload, rating: 6 });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/feedback')
      .send({ ...validFeedbackPayload, email: 'not-an-email' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/feedback', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/api/v1/feedback');
    expect(res.status).toBe(401);
  });

  it('returns 401 with non-Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/feedback')
      .set('Authorization', 'Basic sometoken');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid JWT', async () => {
    const res = await request(app)
      .get('/api/v1/feedback')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  it('returns 403 when JWT role is not admin', async () => {
    const userToken = jwt.sign({ sub: 'user-1', role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/v1/feedback')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('returns array of feedback with valid admin JWT', async () => {
    const rows = [
      { id: 'uuid-1', source: 'web', context: 'home', rating: '5', language: 'en', created_at: new Date().toISOString() },
    ];
    mockQuery.mockResolvedValueOnce({ rows, rowCount: 1 });

    const res = await request(app)
      .get('/api/v1/feedback')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('GET /api/v1/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
