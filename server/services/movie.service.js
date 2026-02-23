const tmdb = require('./external/tmdb');
const omdb = require('./external/omdb');
const Review = require('../models/Review');

const GENRE_MAP = {
  'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
  'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
  'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
  'Mystery': 9648, 'Romance': 10749, 'Science Fiction': 878,
  'Thriller': 53, 'War': 10752, 'Western': 37,
};

/**
 * Get personalized movie recommendations for a user.
 * Falls back to popular movies if user has no reviews.
 */
async function getRecommendations(userId) {
  const reviews = await Review.find({ userId });

  if (reviews.length === 0) {
    return tmdb.getPopular();
  }

  // Get highly rated movies (7+)
  const highlyRatedMovies = reviews
    .filter(r => r.rating >= 7)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  // Weighted genre scoring
  const genreCounts = {};
  reviews.forEach(review => {
    if (review.genres && review.genres.length > 0) {
      review.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + review.rating;
      });
    }
  });
  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([genre]) => genre);

  let recommendedMovies = [];

  // Movie-based recommendations
  if (highlyRatedMovies.length > 0) {
    const recs = await Promise.all(
      highlyRatedMovies.slice(0, 3).map(r => tmdb.getRecommendationsForMovie(r.tmdbId))
    );
    recommendedMovies = recs.flat();
  }

  // Genre-based recommendations
  if (topGenres.length > 0) {
    const genreIds = topGenres.map(g => GENRE_MAP[g]).filter(Boolean);
    if (genreIds.length > 0) {
      const genreMovies = await tmdb.discoverMovies({
        with_genres: genreIds.join(','),
        'vote_average.gte': 6.5,
        sort_by: 'vote_average.desc',
      });
      recommendedMovies = [...recommendedMovies, ...genreMovies];
    }
  }

  // Deduplicate and remove already-reviewed
  const reviewedIds = new Set(reviews.map(r => r.tmdbId));
  const uniqueMovies = [];
  const seenIds = new Set();
  for (const movie of recommendedMovies) {
    if (!seenIds.has(movie.tmdbId) && !reviewedIds.has(movie.tmdbId)) {
      uniqueMovies.push(movie);
      seenIds.add(movie.tmdbId);
    }
  }

  // Backfill with popular if needed
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

  return uniqueMovies.slice(0, 20);
}

/**
 * Get full movie details with external ratings.
 */
async function getMovieDetails(tmdbId) {
  const [movie, certification, watchProviders, ratings] = await Promise.all([
    tmdb.getMovieDetails(tmdbId),
    tmdb.getMovieCertification(tmdbId),
    tmdb.getWatchProviders(tmdbId),
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

  return {
    ...movie,
    certification,
    watchProviders,
    ...ratings,
  };
}

module.exports = { getRecommendations, getMovieDetails };
