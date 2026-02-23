require('../helpers/setup');
const request = require('supertest');
const app = require('../../server/index');

// Mock email service
jest.mock('../../server/services/external/email', () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

describe('Auth API', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'newuser', email: 'new@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe('newuser');
    });

    it('should reject missing fields with 400', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should reject short passwords', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'test', email: 'test@example.com', password: '123' });

      expect(res.status).toBe(400);
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ username: 'user1', email: 'dup@example.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'user2', email: 'dup@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ username: 'loginuser', email: 'login@example.com', password: 'password123' });
    });

    it('should return a token for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return user info with a valid token', async () => {
      const signup = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'meuser', email: 'me@example.com', password: 'password123' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${signup.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('meuser');
    });
  });

  describe('GET /api/health', () => {
    it('should return ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
