const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  // User preferences for AI recommendations
  preferences: {
    favoriteGenres: [String],
    dislikedGenres: [String],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
