const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  // Movie information (denormalized to avoid re-fetching on list render)
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
  genres: [String],

  // Owner
  userId: {
    type: String,
    required: true,
  },
}, {
  timestamps: true, // createdAt = date added to watchlist
});

// One entry per user per movie
watchlistSchema.index({ userId: 1, tmdbId: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
