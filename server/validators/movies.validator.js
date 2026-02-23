const Joi = require('joi');

const search = {
  query: Joi.object({
    q: Joi.string().min(1).required()
      .messages({ 'any.required': 'Search query (q) is required' }),
  }),
};

const getById = {
  params: Joi.object({
    tmdbId: Joi.number().integer().positive().required(),
  }),
};

module.exports = { search, getById };
