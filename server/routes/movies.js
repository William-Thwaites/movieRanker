const express = require('express');
const router = express.Router();
const tmdb = require('../services/tmdb');
const omdb = require('../services/omdb');
const Review = require('../models/Review');
const authMiddleware = require('../middleware/auth');

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
 * GET /api/movies/recommendations
 * Get personalized movie recommendations based on user's reviews
 */
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    // Get user's reviews
    const reviews = await Review.find({ userId: req.userId });

    // If no reviews, return popular movies
    if (reviews.length === 0) {
      const movies = await tmdb.getPopular();
      return res.json({ results: movies });
    }

    // Analyze user preferences
    // 1. Get highly rated movies (7+)
    const highlyRatedMovies = reviews
      .filter(review => review.rating >= 7)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    // 2. Find favorite genres
    const genreCounts = {};
    reviews.forEach(review => {
      if (review.genres && review.genres.length > 0) {
        review.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + review.rating;
        });
      }
    });

    // Get top 3 genres by weighted score
    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    // 3. Get recommendations from TMDB
    let recommendedMovies = [];

    // Get recommendations based on user's top movies
    if (highlyRatedMovies.length > 0) {
      const recommendationPromises = highlyRatedMovies.slice(0, 3).map(review =>
        tmdb.getRecommendationsForMovie(review.tmdbId)
      );
      const movieRecs = await Promise.all(recommendationPromises);
      recommendedMovies = movieRecs.flat();
    }

    // Get genre-based recommendations using discover
    if (topGenres.length > 0) {
      // Map genre names to TMDB genre IDs
      const genreMap = {
        'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
        'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
        'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
        'Mystery': 9648, 'Romance': 10749, 'Science Fiction': 878,
        'Thriller': 53, 'War': 10752, 'Western': 37
      };

      const genreIds = topGenres
        .map(genre => genreMap[genre])
        .filter(id => id !== undefined);

      if (genreIds.length > 0) {
        const genreMovies = await tmdb.discoverMovies({
          with_genres: genreIds.join(','),
          'vote_average.gte': 6.5,
          sort_by: 'vote_average.desc',
        });
        recommendedMovies = [...recommendedMovies, ...genreMovies];
      }
    }

    // 4. Remove duplicates and already reviewed movies
    const reviewedIds = new Set(reviews.map(r => r.tmdbId));
    const uniqueMovies = [];
    const seenIds = new Set();

    for (const movie of recommendedMovies) {
      if (!seenIds.has(movie.tmdbId) && !reviewedIds.has(movie.tmdbId)) {
        uniqueMovies.push(movie);
        seenIds.add(movie.tmdbId);
      }
    }

    // 5. If we don't have enough recommendations, add some popular movies
    if (uniqueMovies.length < 10) {
      const popularMovies = await tmdb.getPopular();
      for (const movie of popularMovies) {
        if (!seenIds.has(movie.tmdbId) && !reviewedIds.has(movie.tmdbId)) {
          uniqueMovies.push(movie);
          seenIds.add(movie.tmdbId);
          if (uniqueMovies.length >= 20) break;
        }
      }
    }

    res.json({ results: uniqueMovies.slice(0, 20) });
  } catch (error) {
    console.error('Recommendations error:', error);
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
    // Get all movie data in parallel
    const [movie, certification, watchProviders, ratings] = await Promise.all([
      tmdb.getMovieDetails(tmdbId),
      tmdb.getMovieCertification(tmdbId),
      tmdb.getWatchProviders(tmdbId),
      // Get ratings from OMDb
      (async () => {
        const movieData = await tmdb.getMovieDetails(tmdbId);
        if (movieData.imdbId) {
          return await omdb.getRatings(movieData.imdbId);
        } else {
          const omdbData = await omdb.searchByTitle(movieData.title, movieData.year);
          return omdbData || { imdbRating: null, rottenTomatoes: null };
        }
      })(),
    ]);

    // Combine all data
    res.json({
      ...movie,
      certification,
      watchProviders,
      ...ratings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;