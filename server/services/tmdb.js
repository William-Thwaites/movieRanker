const axios = require('axios');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: process.env.TMDB_API_KEY,
  },
});

/**
 * Search for movies by title
 */
async function searchMovies(query) {
  try {
    const response = await tmdbApi.get('/search/movie', {
      params: { query },
    });

    return response.data.results.map(movie => ({
      tmdbId: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      overview: movie.overview,
      posterUrl: movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : null,
      rating: movie.vote_average || 0,
      vote_count: movie.vote_count || 0,
    }));
  } catch (error) {
    console.error('TMDB search error:', error.message);
    throw new Error('Failed to search movies');
  }
}

/**
 * Enhanced search that includes franchise/sequel movies
 */
async function searchMoviesWithFranchise(query) {
  try {
    // Get initial search results
    const searchResults = await searchMovies(query);

    if (searchResults.length === 0) {
      return searchResults;
    }

    // Sort by vote_count to find the most popular movies first
    const sortedByPopularity = [...searchResults].sort((a, b) =>
      (b.vote_count || 0) - (a.vote_count || 0)
    );

    // Check top 5 most popular results for franchise collections
    const collectionPromises = sortedByPopularity.slice(0, 5).map(async (movie) => {
      try {
        const detailsResponse = await tmdbApi.get(`/movie/${movie.tmdbId}`);
        const collection = detailsResponse.data.belongs_to_collection;

        if (collection) {
          return await getCollection(collection.id);
        }
        return [];
      } catch (error) {
        return [];
      }
    });

    const collectionResults = await Promise.all(collectionPromises);

    // Flatten and combine all results
    const allMovies = [...searchResults];

    collectionResults.forEach(movies => {
      movies.forEach(movie => {
        // Add if not already in results (avoid duplicates)
        if (!allMovies.find(m => m.tmdbId === movie.tmdbId)) {
          allMovies.push(movie);
        }
      });
    });

    return allMovies;
  } catch (error) {
    console.error('TMDB enhanced search error:', error.message);
    throw new Error('Failed to search movies');
  }
}

/**
 * Get detailed movie info by TMDB ID
 */
async function getMovieDetails(tmdbId) {
  try {
    const response = await tmdbApi.get(`/movie/${tmdbId}`);
    const movie = response.data;

    return {
      tmdbId: movie.id,
      imdbId: movie.imdb_id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      overview: movie.overview,
      posterUrl: movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : null,
      genres: movie.genres.map(g => g.name),
      runtime: movie.runtime,
      belongs_to_collection: movie.belongs_to_collection,
    };
  } catch (error) {
    console.error('TMDB details error:', error.message);
    throw new Error('Failed to get movie details');
  }
}

/**
 * Get age rating/certification for a movie
 */
async function getMovieCertification(tmdbId) {
  try {
    const response = await tmdbApi.get(`/movie/${tmdbId}/release_dates`);
    const releaseDates = response.data.results;

    // Try to find UK certification first (GB = Great Britain)
    const ukRelease = releaseDates.find(r => r.iso_3166_1 === 'GB');
    if (ukRelease && ukRelease.release_dates.length > 0) {
      const cert = ukRelease.release_dates.find(rd => rd.certification);
      if (cert && cert.certification) {
        return cert.certification;
      }
    }

    // Fallback to any certification available
    for (const release of releaseDates) {
      if (release.release_dates.length > 0) {
        const cert = release.release_dates.find(rd => rd.certification);
        if (cert && cert.certification) {
          return cert.certification;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('TMDB certification error:', error.message);
    return null;
  }
}

/**
 * Get streaming availability for a movie
 */
async function getWatchProviders(tmdbId) {
  try {
    const response = await tmdbApi.get(`/movie/${tmdbId}/watch/providers`);
    const providers = response.data.results;

    // Try to get US providers first
    const usProviders = providers['US'];
    if (usProviders) {
      return {
        link: usProviders.link,
        flatrate: usProviders.flatrate || [], // Subscription services
        buy: usProviders.buy || [], // Purchase options
        rent: usProviders.rent || [], // Rental options
      };
    }

    return null;
  } catch (error) {
    console.error('TMDB watch providers error:', error.message);
    return null;
  }
}

/**
 * Get collection details including all movies in the franchise
 */
async function getCollection(collectionId) {
  try {
    const response = await tmdbApi.get(`/collection/${collectionId}`);
    const collection = response.data;

    return collection.parts.map(movie => ({
      tmdbId: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      overview: movie.overview,
      posterUrl: movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : null,
      rating: movie.vote_average || 0,
      vote_count: movie.vote_count || 0,
    }));
  } catch (error) {
    console.error('TMDB collection error:', error.message);
    return [];
  }
}

/**
 * Get trending movies
 */
async function getTrending() {
  try {
    const response = await tmdbApi.get('/trending/movie/week');
    return response.data.results.map(movie => ({
      tmdbId: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      overview: movie.overview,
      posterUrl: movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : null,
      rating: movie.vote_average,
    }));
  } catch (error) {
    console.error('TMDB trending error:', error.message);
    throw new Error('Failed to get trending movies');
  }
}

/**
 * Get popular movies
 */
async function getPopular() {
  try {
    const response = await tmdbApi.get('/movie/popular');
    return response.data.results.map(movie => ({
      tmdbId: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      overview: movie.overview,
      posterUrl: movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : null,
      rating: movie.vote_average,
    }));
  } catch (error) {
    console.error('TMDB popular error:', error.message);
    throw new Error('Failed to get popular movies');
  }
}

/**
 * Get top rated movies
 */
async function getTopRated() {
  try {
    const response = await tmdbApi.get('/movie/top_rated');
    return response.data.results.map(movie => ({
      tmdbId: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      overview: movie.overview,
      posterUrl: movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : null,
      rating: movie.vote_average,
    }));
  } catch (error) {
    console.error('TMDB top rated error:', error.message);
    throw new Error('Failed to get top rated movies');
  }
}

/**
 * Get new releases (now playing movies)
 */
async function getNewReleases() {
  try {
    const response = await tmdbApi.get('/movie/now_playing');
    return response.data.results.map(movie => ({
      tmdbId: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      overview: movie.overview,
      posterUrl: movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : null,
      rating: movie.vote_average,
    }));
  } catch (error) {
    console.error('TMDB new releases error:', error.message);
    throw new Error('Failed to get new releases');
  }
}

/**
 * Get movie recommendations based on a specific movie
 */
async function getRecommendationsForMovie(tmdbId) {
  try {
    const response = await tmdbApi.get(`/movie/${tmdbId}/recommendations`);
    return response.data.results.map(movie => ({
      tmdbId: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      overview: movie.overview,
      posterUrl: movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : null,
      rating: movie.vote_average || 0,
    }));
  } catch (error) {
    console.error('TMDB recommendations error:', error.message);
    return [];
  }
}

/**
 * Discover movies based on criteria (genres, year, etc.)
 */
async function discoverMovies(options = {}) {
  try {
    const params = {
      sort_by: options.sortBy || 'popularity.desc',
      'vote_count.gte': 100, // Only movies with decent number of votes
      ...options,
    };

    const response = await tmdbApi.get('/discover/movie', { params });
    return response.data.results.map(movie => ({
      tmdbId: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      overview: movie.overview,
      posterUrl: movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : null,
      rating: movie.vote_average || 0,
    }));
  } catch (error) {
    console.error('TMDB discover error:', error.message);
    throw new Error('Failed to discover movies');
  }
}

module.exports = {
  searchMovies,
  searchMoviesWithFranchise,
  getMovieDetails,
  getTrending,
  getPopular,
  getTopRated,
  getNewReleases,
  getCollection,
  getRecommendationsForMovie,
  discoverMovies,
  getMovieCertification,
  getWatchProviders,
};