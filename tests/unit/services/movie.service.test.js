require('../../helpers/setup');
const Review = require('../../../server/models/Review');

// Mock external services
jest.mock('../../../server/services/external/tmdb');
jest.mock('../../../server/services/external/omdb');

const tmdb = require('../../../server/services/external/tmdb');
const omdb = require('../../../server/services/external/omdb');
const movieService = require('../../../server/services/movie.service');

const userId = 'rec-test-user';

describe('movie.service', () => {
  describe('getRecommendations', () => {
    it('should return popular movies when user has no reviews', async () => {
      const mockPopular = [{ tmdbId: 1, title: 'Popular Movie' }];
      tmdb.getPopular.mockResolvedValue(mockPopular);

      const result = await movieService.getRecommendations(userId);
      expect(result).toEqual(mockPopular);
      expect(tmdb.getPopular).toHaveBeenCalled();
    });

    it('should return personalized recommendations based on reviews', async () => {
      await Review.create([
        { tmdbId: 100, title: 'Loved It', rating: 9, review: 'Great', userId, genres: ['Action'] },
        { tmdbId: 200, title: 'Liked It', rating: 7, review: 'Good', userId, genres: ['Action'] },
      ]);

      tmdb.getRecommendationsForMovie.mockResolvedValue([
        { tmdbId: 300, title: 'Rec Movie' },
      ]);
      tmdb.discoverMovies.mockResolvedValue([
        { tmdbId: 400, title: 'Genre Movie' },
      ]);
      tmdb.getPopular.mockResolvedValue([]);

      const result = await movieService.getRecommendations(userId);
      expect(result.length).toBeGreaterThanOrEqual(2);
      // Should not include already-reviewed movies
      expect(result.find(m => m.tmdbId === 100)).toBeUndefined();
      expect(result.find(m => m.tmdbId === 200)).toBeUndefined();
    });
  });

  describe('getMovieDetails', () => {
    it('should merge TMDB details with OMDb ratings', async () => {
      tmdb.getMovieDetails.mockResolvedValue({
        tmdbId: 603, title: 'The Matrix', imdbId: 'tt0133093',
        year: '1999', genres: ['Action'],
      });
      tmdb.getMovieCertification.mockResolvedValue('R');
      tmdb.getWatchProviders.mockResolvedValue(null);
      omdb.getRatings.mockResolvedValue({
        imdbRating: '8.7', rottenTomatoes: '83%', metascore: '73',
      });

      const result = await movieService.getMovieDetails(603);
      expect(result.title).toBe('The Matrix');
      expect(result.certification).toBe('R');
      expect(result.imdbRating).toBe('8.7');
      expect(result.rottenTomatoes).toBe('83%');
    });

    it('should fall back to OMDb title search when no IMDb ID', async () => {
      tmdb.getMovieDetails.mockResolvedValue({
        tmdbId: 999, title: 'Some Movie', imdbId: null,
        year: '2024', genres: ['Drama'],
      });
      tmdb.getMovieCertification.mockResolvedValue(null);
      tmdb.getWatchProviders.mockResolvedValue(null);
      omdb.searchByTitle.mockResolvedValue({
        imdbRating: '7.0', rottenTomatoes: '75%', metascore: '60',
      });

      const result = await movieService.getMovieDetails(999);
      expect(result.title).toBe('Some Movie');
      expect(omdb.searchByTitle).toHaveBeenCalledWith('Some Movie', '2024');
    });
  });
});
