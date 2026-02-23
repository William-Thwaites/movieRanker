require('../helpers/setup');
const request = require('supertest');
const app = require('../../server/index');

// Mock external services
jest.mock('../../server/services/external/email', () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('../../server/services/external/tmdb', () => ({
  getMovieDetails: jest.fn().mockResolvedValue({ genres: ['Action'] }),
}));

let authToken;

beforeEach(async () => {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ username: 'reviewer', email: 'reviewer@example.com', password: 'password123' });
  authToken = res.body.token;
});

describe('Reviews API', () => {
  const reviewData = {
    tmdbId: 603,
    title: 'The Matrix',
    year: '1999',
    rating: 9,
    review: 'Brilliant film',
  };

  describe('POST /api/reviews', () => {
    it('should create a review', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      expect(res.status).toBe(201);
      expect(res.body.review.title).toBe('The Matrix');
      expect(res.body.review.rating).toBe(9);
    });

    it('should reject duplicate review for same movie', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .send(reviewData);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/reviews', () => {
    it('should return the authenticated user\'s reviews', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      const res = await request(app)
        .get('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reviews).toHaveLength(1);
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('should update a review', async () => {
      const created = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      const res = await request(app)
        .put(`/api/reviews/${created.body.review._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 7, review: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.review.rating).toBe(7);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should delete a review', async () => {
      const created = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      const res = await request(app)
        .delete(`/api/reviews/${created.body.review._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      const list = await request(app)
        .get('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`);

      expect(list.body.reviews).toHaveLength(0);
    });
  });
});
