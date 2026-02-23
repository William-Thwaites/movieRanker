const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const movieRoutes = require('./routes/movies');
const reviewRoutes = require('./routes/reviews');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://movieranker.co.uk',
  credentials: true
}));
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Movie Ranker API is running!' });
});

// Centralized error handling (must be after all routes)
app.use(errorHandler);

module.exports = app;
