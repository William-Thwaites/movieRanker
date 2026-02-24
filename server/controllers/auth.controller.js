const authService = require('../services/auth.service');
const asyncHandler = require('../middleware/asyncHandler');

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  res.status(201).json({ message: 'User created successfully', ...result });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ message: 'Login successful', ...result });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    user: { id: req.user._id, username: req.user.username, email: req.user.email },
  });
});

const logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};

const forgotPassword = asyncHandler(async (req, res) => {
  const didSend = await authService.forgotPassword(req.body.email);
  if (didSend) {
    res.json({ message: 'A password reset link has been sent.' });
    return;
  } 
  res.json({ message: 'There is no account associated with that email address.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  res.json({ message: 'Password has been reset successfully' });
});

const verifyResetToken = asyncHandler(async (req, res) => {
  await authService.verifyResetToken(req.params.token);
  res.json({ valid: true });
});

module.exports = { signup, login, me, logout, forgotPassword, resetPassword, verifyResetToken };
