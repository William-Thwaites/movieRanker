const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Movie information
  tmdbId: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  year: String,
  posterUrl: String,
  genres: [String], // Array of genre names

  // Review content
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 10, // 0-10 rating scale
  },
  review: {
    type: String,
    required: true,
  },

  // For future multi-user support
  userId: {
    type: String,
    default: 'default_user', // Single user for now
  },

  // Metadata
  watchedDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Create compound index for efficient queries
reviewSchema.index({ userId: 1, tmdbId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
