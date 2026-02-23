const Joi = require('joi');

const signup = {
  body: Joi.object({
    username: Joi.string().trim().min(3).required()
      .messages({ 'string.min': 'Username must be at least 3 characters' }),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
      .messages({ 'string.min': 'Password must be at least 6 characters' }),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  body: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
      .messages({ 'string.min': 'Password must be at least 6 characters' }),
  }),
};

const verifyResetToken = {
  params: Joi.object({
    token: Joi.string().required(),
  }),
};

module.exports = { signup, login, forgotPassword, resetPassword, verifyResetToken };
