const reviewService = require('../services/review.service');
const asyncHandler = require('../middleware/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getUserReviews(req.userId);
  res.json({ reviews });
});

const getByMovie = asyncHandler(async (req, res) => {
  const review = await reviewService.getReviewByMovie(req.userId, req.params.tmdbId);
  res.json({ review });
});

const create = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.userId, req.body);
  res.status(201).json({ review });
});

const update = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(req.userId, req.params.id, req.body);
  res.json({ review });
});

const remove = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.userId, req.params.id);
  res.json({ message: 'Review deleted successfully' });
});

const backfillGenres = asyncHandler(async (req, res) => {
  const { updated, failed } = await reviewService.backfillGenres(req.userId);
  if (updated === 0 && failed === 0) {
    return res.json({ message: 'All reviews already have genres', updated: 0 });
  }
  res.json({
    message: `Backfill complete. Updated ${updated} reviews, ${failed} failed.`,
    updated,
    failed,
  });
});

module.exports = { list, getByMovie, create, update, remove, backfillGenres };
