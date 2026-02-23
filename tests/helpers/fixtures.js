const mongoose = require('mongoose');

const makeUser = (overrides = {}) => ({
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  ...overrides,
});

const makeReview = (overrides = {}) => ({
  tmdbId: 603,
  title: 'The Matrix',
  year: '1999',
  posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
  rating: 9,
  review: 'A mind-bending sci-fi masterpiece.',
  genres: ['Action', 'Science Fiction'],
  watchedDate: new Date('2024-01-15'),
  userId: new mongoose.Types.ObjectId().toString(),
  ...overrides,
});

module.exports = { makeUser, makeReview };
