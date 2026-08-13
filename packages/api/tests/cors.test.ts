import request from 'supertest';

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

describe('CORS — wildcard mode (default, no CORS_ORIGINS env)', () => {
  let app: ReturnType<typeof import('../src/app').createApp>;

  beforeAll(() => {
    delete process.env.CORS_ORIGINS;
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    app = require('../src/app').createApp();
  });

  it('allows any origin when CORS_ORIGINS is not set', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://any-domain.example');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});

describe('CORS — restricted mode (CORS_ORIGINS env set)', () => {
  let app: ReturnType<typeof import('../src/app').createApp>;
  const ALLOWED = 'https://humanalert.org';

  beforeAll(() => {
    process.env.CORS_ORIGINS = `${ALLOWED},https://app.humanalert.org`;
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    app = require('../src/app').createApp();
  });

  afterAll(() => {
    delete process.env.CORS_ORIGINS;
  });

  it('allows a listed origin', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', ALLOWED);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
  });

  it('blocks an unlisted origin (no ACAO header)', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows requests with no Origin header (server-to-server)', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
  });
});

describe('CORS — wildcard explicit (CORS_ORIGINS=*)', () => {
  let app: ReturnType<typeof import('../src/app').createApp>;

  beforeAll(() => {
    process.env.CORS_ORIGINS = '*';
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    app = require('../src/app').createApp();
  });

  afterAll(() => {
    delete process.env.CORS_ORIGINS;
  });

  it('allows any origin when CORS_ORIGINS=*', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://random.example');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});
