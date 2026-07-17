// Set env vars before any module loads
process.env.JWT_SECRET = 'test-secret-for-jest';
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
process.env.NODE_ENV = 'test';
