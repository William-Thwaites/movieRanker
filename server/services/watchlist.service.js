const Watchlist = require('../models/Watchlist');
const tmdb = require('./external/tmdb');
const { conflict, notFound } = require('../errors');

async function getUserWatchlist(userId) {
  return Watchlist.find({ userId }).sort({ createdAt: -1 });
}

async function getWatchlistEntry(userId, tmdbId) {
  return Watchlist.findOne({ userId, tmdbId: parseInt(tmdbId) });
}

async function addToWatchlist(userId, data) {
  const { tmdbId, title, year, posterUrl } = data;

  let genres = [];
  try {
    const movieDetails = await tmdb.getMovieDetails(tmdbId);
    genres = movieDetails.genres || [];
  } catch (err) {
    console.error('Error fetching genres for watchlist entry:', err.message);
  }

  const entry = new Watchlist({ tmdbId, title, year, posterUrl, genres, userId });

  try {
    await entry.save();
  } catch (err) {
    if (err.code === 11000) throw conflict('Movie is already in your watchlist');
    throw err;
  }

  return entry;
}

async function removeFromWatchlist(userId, tmdbId) {
  const deleted = await Watchlist.findOneAndDelete({ userId, tmdbId: parseInt(tmdbId) });
  if (!deleted) throw notFound('Watchlist entry not found');
  return deleted;
}

module.exports = { getUserWatchlist, getWatchlistEntry, addToWatchlist, removeFromWatchlist };
