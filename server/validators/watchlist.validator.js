const Joi = require('joi');

const addToWatchlist = {
  body: Joi.object({
    tmdbId: Joi.number().integer().positive().required(),
    title: Joi.string().required(),
    year: Joi.string().allow('', null),
    posterUrl: Joi.string().allow('', null),
  }),
};

const removeFromWatchlist = {
  params: Joi.object({
    tmdbId: Joi.number().integer().positive().required(),
  }),
};

const checkWatchlist = {
  params: Joi.object({
    tmdbId: Joi.number().integer().positive().required(),
  }),
};

module.exports = { addToWatchlist, removeFromWatchlist, checkWatchlist };
