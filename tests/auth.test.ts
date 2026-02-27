/**
 * Authentication Tests
 * Tests login endpoint, JWT validation, and protected route access
 */
import request from 'supertest';
import { createApp } from '../src/app';
import { AppDataSource } from '../src/database/data-source';
import { Application } from 'express';

let app: Application;

// Mock the database so tests don't need a real PostgreSQL connection
jest.mock('../src/database/data-source', () => ({
  AppDataSource: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getRepository: jest.fn().mockReturnValue({
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    }),
    isInitialized: true,
  },
}));

beforeAll(() => {
  app = createApp();
});

describe('POST /auth/login', () => {
  it('should return a JWT token for valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'user1', password: 'password1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('access_token');
    expect(typeof res.body.data.access_token).toBe('string');
  });

  it('should return 401 for invalid password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'user1', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('should return 401 for unknown username', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'nonexistent', password: 'anypass' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if username is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ password: 'password1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'user1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should allow login for all sample users', async () => {
    const users = [
      { username: 'user1', password: 'password1' },
      { username: 'user2', password: 'password2' },
      { username: 'admin', password: 'adminpass' },
    ];

    for (const creds of users) {
      const res = await request(app).post('/auth/login').send(creds);
      expect(res.status).toBe(200);
      expect(res.body.data.access_token).toBeDefined();
    }
  });
});

describe('Protected routes (JWT required)', () => {
  it('should return 401 when accessing /tasks without token', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for an invalid/malformed token', async () => {
    const res = await request(app)
      .get('/tasks')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  it('should return 401 when Authorization header is missing Bearer prefix', async () => {
    const res = await request(app)
      .get('/tasks')
      .set('Authorization', 'notabearer token');
    expect(res.status).toBe(401);
  });

  it('should allow access to /tasks with valid token', async () => {
    // First, get a valid token
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'user1', password: 'password1' });

    const token = loginRes.body.data.access_token;

    const res = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
