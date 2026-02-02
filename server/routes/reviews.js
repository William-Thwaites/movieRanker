const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

/**
 * GET /api/reviews
 * Get all reviews for the current user
 */
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({ userId: 'default_user' })
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
router.get('/movie/:tmdbId', async (req, res) => {
  try {
    const review = await Review.findOne({
      userId: 'default_user',
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
router.post('/', async (req, res) => {
  try {
    const { tmdbId, title, year, posterUrl, rating, review, watchedDate } = req.body;

    // Check if review already exists for this movie
    const existingReview = await Review.findOne({
      userId: 'default_user',
      tmdbId,
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists for this movie' });
    }

    const newReview = new Review({
      tmdbId,
      title,
      year,
      posterUrl,
      rating,
      review,
      watchedDate: watchedDate || Date.now(),
      userId: 'default_user',
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
router.put('/:id', async (req, res) => {
  try {
    const { rating, review, watchedDate } = req.body;

    const updatedReview = await Review.findOneAndUpdate(
      { _id: req.params.id, userId: 'default_user' },
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
router.delete('/:id', async (req, res) => {
  try {
    const deletedReview = await Review.findOneAndDelete({
      _id: req.params.id,
      userId: 'default_user',
    });

    if (!deletedReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
