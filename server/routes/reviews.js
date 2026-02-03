const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const tmdb = require('../services/tmdb');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/reviews
 * Get all reviews for the current user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.userId })
      .sort({ createdAt: -1 }); // Newest first
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reviews/movie/:tmdbId
 * Get review for a specific movie
 */
router.get('/movie/:tmdbId', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findOne({
      userId: req.userId,
      tmdbId: parseInt(req.params.tmdbId),
    });
    res.json({ review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reviews
 * Create a new review
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tmdbId, title, year, posterUrl, rating, review, watchedDate } = req.body;

    // Check if review already exists for this movie
    const existingReview = await Review.findOne({
      userId: req.userId,
      tmdbId,
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists for this movie' });
    }

    // Fetch movie details to get genres
    let genres = [];
    try {
      const movieDetails = await tmdb.getMovieDetails(tmdbId);
      genres = movieDetails.genres || [];
    } catch (error) {
      console.error('Error fetching genres:', error.message);
      // Continue without genres if fetch fails
    }

    const newReview = new Review({
      tmdbId,
      title,
      year,
      posterUrl,
      rating,
      review,
      genres,
      watchedDate: watchedDate || Date.now(),
      userId: req.userId,
    });

    await newReview.save();
    res.status(201).json({ review: newReview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/reviews/:id
 * Update an existing review
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { rating, review, watchedDate } = req.body;

    const updatedReview = await Review.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { rating, review, watchedDate },
      { new: true, runValidators: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ review: updatedReview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/reviews/:id
 * Delete a review
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deletedReview = await Review.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deletedReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reviews/backfill-genres
 * Backfill genres for existing reviews that don't have them
 */
router.post('/backfill-genres', authMiddleware, async (req, res) => {
  try {
    // Find all reviews without genres or with empty genres array
    const reviewsWithoutGenres = await Review.find({
      userId: req.userId,
      $or: [
        { genres: { $exists: false } },
        { genres: { $size: 0 } }
      ]
    });

    if (reviewsWithoutGenres.length === 0) {
      return res.json({ message: 'All reviews already have genres', updated: 0 });
    }

    let updated = 0;
    let failed = 0;

    // Fetch genres for each review
    for (const review of reviewsWithoutGenres) {
      try {
        const movieDetails = await tmdb.getMovieDetails(review.tmdbId);
        review.genres = movieDetails.genres || [];
        await review.save();
        updated++;
      } catch (error) {
        console.error(`Failed to fetch genres for ${review.title}:`, error.message);
        failed++;
      }
    }

    res.json({
      message: `Backfill complete. Updated ${updated} reviews, ${failed} failed.`,
      updated,
      failed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
