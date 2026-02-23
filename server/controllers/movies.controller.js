const tmdb = require('../services/external/tmdb');
const movieService = require('../services/movie.service');
const asyncHandler = require('../middleware/asyncHandler');

const search = asyncHandler(async (req, res) => {
  const movies = await tmdb.searchMoviesWithFranchise(req.query.q);
  res.json({ results: movies });
});

const trending = asyncHandler(async (req, res) => {
  const movies = await tmdb.getTrending();
  res.json({ results: movies });
});

const popular = asyncHandler(async (req, res) => {
  const movies = await tmdb.getPopular();
  res.json({ results: movies });
});

const topRated = asyncHandler(async (req, res) => {
  const movies = await tmdb.getTopRated();
  res.json({ results: movies });
});

const newReleases = asyncHandler(async (req, res) => {
  const movies = await tmdb.getNewReleases();
  res.json({ results: movies });
});

const recommendations = asyncHandler(async (req, res) => {
  const movies = await movieService.getRecommendations(req.userId);
  res.json({ results: movies });
});

const getById = asyncHandler(async (req, res) => {
  const movie = await movieService.getMovieDetails(parseInt(req.params.tmdbId));
  res.json(movie);
});

module.exports = { search, trending, popular, topRated, newReleases, recommendations, getById };
