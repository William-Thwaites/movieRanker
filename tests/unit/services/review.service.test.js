require('../../helpers/setup');
const { makeReview } = require('../../helpers/fixtures');
const reviewService = require('../../../server/services/review.service');

// Mock the external TMDB service
jest.mock('../../../server/services/external/tmdb', () => ({
  getMovieDetails: jest.fn().mockResolvedValue({
    genres: ['Action', 'Science Fiction'],
  }),
}));

const userId = 'test-user-id-123';

describe('review.service', () => {
  describe('createReview', () => {
    it('should create and return a new review', async () => {
      const data = makeReview({ userId });
      const review = await reviewService.createReview(userId, data);
      expect(review.title).toBe('The Matrix');
      expect(review.userId).toBe(userId);
      expect(review.genres).toEqual(['Action', 'Science Fiction']);
    });

    it('should throw if user already reviewed this movie', async () => {
      const data = makeReview({ userId });
      await reviewService.createReview(userId, data);
      await expect(reviewService.createReview(userId, data))
        .rejects.toThrow('Review already exists for this movie');
    });
  });

  describe('getUserReviews', () => {
    it('should return reviews sorted newest first', async () => {
      await reviewService.createReview(userId, makeReview({ userId, tmdbId: 1, title: 'First' }));
      await reviewService.createReview(userId, makeReview({ userId, tmdbId: 2, title: 'Second' }));

      const reviews = await reviewService.getUserReviews(userId);
      expect(reviews).toHaveLength(2);
      expect(reviews[0].title).toBe('Second');
    });

    it('should not return reviews from other users', async () => {
      await reviewService.createReview(userId, makeReview({ userId }));
      await reviewService.createReview('other-user', makeReview({ userId: 'other-user', tmdbId: 999 }));

      const reviews = await reviewService.getUserReviews(userId);
      expect(reviews).toHaveLength(1);
    });
  });

  describe('getReviewByMovie', () => {
    it('should return the review for a specific movie', async () => {
      await reviewService.createReview(userId, makeReview({ userId }));
      const review = await reviewService.getReviewByMovie(userId, 603);
      expect(review).toBeTruthy();
      expect(review.title).toBe('The Matrix');
    });

    it('should return null if no review exists', async () => {
      const review = await reviewService.getReviewByMovie(userId, 999);
      expect(review).toBeNull();
    });
  });

  describe('updateReview', () => {
    it('should update rating and review text', async () => {
      const created = await reviewService.createReview(userId, makeReview({ userId }));
      const updated = await reviewService.updateReview(userId, created._id, {
        rating: 7,
        review: 'Updated review text',
      });
      expect(updated.rating).toBe(7);
      expect(updated.review).toBe('Updated review text');
    });

    it('should throw 404 if review not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await expect(reviewService.updateReview(userId, fakeId, { rating: 5 }))
        .rejects.toThrow('Review not found');
    });

    it('should not allow updating another user\'s review', async () => {
      const created = await reviewService.createReview(userId, makeReview({ userId }));
      await expect(reviewService.updateReview('other-user', created._id, { rating: 1 }))
        .rejects.toThrow('Review not found');
    });
  });

  describe('deleteReview', () => {
    it('should delete the review', async () => {
      const created = await reviewService.createReview(userId, makeReview({ userId }));
      await reviewService.deleteReview(userId, created._id);
      const reviews = await reviewService.getUserReviews(userId);
      expect(reviews).toHaveLength(0);
    });

    it('should throw 404 if review not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await expect(reviewService.deleteReview(userId, fakeId))
        .rejects.toThrow('Review not found');
    });
  });
});
