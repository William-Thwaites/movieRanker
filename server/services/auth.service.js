const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('./external/email');
const { badRequest, unauthorized } = require('../errors');

async function signup({ username, email, password }) {
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    if (existingUser.email === email) throw badRequest('Email already registered');
    if (existingUser.username === username) throw badRequest('Username already taken');
  }

  const user = new User({ username, email, password });
  await user.save();

  // Non-blocking welcome email
  sendWelcomeEmail(user.email, user.username);

  const token = generateToken(user._id);
  return {
    token,
    user: { id: user._id, username: user.username, email: user.email },
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw unauthorized('Invalid credentials');

  const isValid = await user.comparePassword(password);
  if (!isValid) throw unauthorized('Invalid credentials');

  const token = generateToken(user._id);
  return {
    token,
    user: { id: user._id, username: user.username, email: user.email },
  };
}

async function forgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return false; // Silent return to prevent email enumeration

  const resetToken = crypto.randomBytes(32).toString('hex');  
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save({ validateBeforeSave: false });

  await sendPasswordResetEmail(user.email, resetToken);
  return true
}

async function resetPassword({ token, password }) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) throw badRequest('Invalid or expired reset token');

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();
}

async function verifyResetToken(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) throw badRequest('Invalid or expired reset token');
  return true;
}

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { signup, login, forgotPassword, resetPassword, verifyResetToken };
