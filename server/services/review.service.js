const Review = require('../models/Review');
const tmdb = require('./external/tmdb');
const { badRequest, notFound } = require('../errors');

async function getUserReviews(userId) {
  return Review.find({ userId }).sort({ createdAt: -1 });
}

async function getReviewByMovie(userId, tmdbId) {
  return Review.findOne({ userId, tmdbId: parseInt(tmdbId) });
}

async function createReview(userId, data) {
  const { tmdbId, title, year, posterUrl, rating, review, watchedDate } = data;

  const existing = await Review.findOne({ userId, tmdbId });
  if (existing) throw badRequest('Review already exists for this movie');

  let genres = [];
  try {
    const movieDetails = await tmdb.getMovieDetails(tmdbId);
    genres = movieDetails.genres || [];
  } catch (err) {
    console.error('Error fetching genres:', err.message);
  }

  const newReview = new Review({
    tmdbId, title, year, posterUrl, rating, review, genres,
    watchedDate: watchedDate || Date.now(),
    userId,
  });

  await newReview.save();
  return newReview;
}

async function updateReview(userId, reviewId, data) {
  const { rating, review, watchedDate } = data;

  const updatedReview = await Review.findOneAndUpdate(
    { _id: reviewId, userId },
    { rating, review, watchedDate },
    { new: true, runValidators: true },
  );

  if (!updatedReview) throw notFound('Review not found');
  return updatedReview;
}

async function deleteReview(userId, reviewId) {
  const deleted = await Review.findOneAndDelete({ _id: reviewId, userId });
  if (!deleted) throw notFound('Review not found');
  return deleted;
}

async function backfillGenres(userId) {
  const reviewsWithoutGenres = await Review.find({
    userId,
    $or: [{ genres: { $exists: false } }, { genres: { $size: 0 } }],
  });

  if (reviewsWithoutGenres.length === 0) {
    return { updated: 0, failed: 0 };
  }

  let updated = 0;
  let failed = 0;

  for (const review of reviewsWithoutGenres) {
    try {
      const movieDetails = await tmdb.getMovieDetails(review.tmdbId);
      review.genres = movieDetails.genres || [];
      await review.save();
      updated++;
    } catch (err) {
      console.error(`Failed to fetch genres for ${review.title}:`, err.message);
      failed++;
    }
  }

  return { updated, failed };
}

module.exports = {
  getUserReviews, getReviewByMovie, createReview,
  updateReview, deleteReview, backfillGenres,
};
