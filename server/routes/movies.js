const express = require('express');
const router = express.Router();
const tmdb = require('../services/tmdb');
const omdb = require('../services/omdb');

/**
 * GET /api/movies/search?q=movie+title
 * Search for movies by title (includes franchise/sequel movies)
 */
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Search query (q) is required' });
  }

  try {
    const movies = await tmdb.searchMoviesWithFranchise(q);
    res.json({ results: movies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/movies/trending
 * Get trending movies this week
 */
router.get('/trending', async (req, res) => {
  try {
    const movies = await tmdb.getTrending();
    res.json({ results: movies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/movies/popular
 * Get popular movies
 */
router.get('/popular', async (req, res) => {
  try {
    const movies = await tmdb.getPopular();
    res.json({ results: movies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/movies/toprated
 * Get top rated movies
 */
router.get('/toprated', async (req, res) => {
  try {
    const movies = await tmdb.getTopRated();
    res.json({ results: movies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/movies/newreleases
 * Get new releases (now playing movies)
 */
router.get('/newreleases', async (req, res) => {
  try {
    const movies = await tmdb.getNewReleases();
    res.json({ results: movies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/movies/:tmdbId
 * Get full movie details including ratings from both APIs
 */
router.get('/:tmdbId', async (req, res) => {
  const { tmdbId } = req.params;

  try {
    // Get basic info from TMDB
    const movie = await tmdb.getMovieDetails(tmdbId);

    // Get ratings from OMDb using IMDb ID
    let ratings = { imdbRating: null, rottenTomatoes: null };
    
    if (movie.imdbId) {
      ratings = await omdb.getRatings(movie.imdbId);
    } else {
      // Fallback: search OMDb by title
      const omdbData = await omdb.searchByTitle(movie.title, movie.year);
      if (omdbData) {
        ratings = omdbData;
      }
    }

    // Combine all data
    res.json({
      ...movie,
      ...ratings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;