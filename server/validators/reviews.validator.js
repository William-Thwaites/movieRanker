const Joi = require('joi');

const createReview = {
  body: Joi.object({
    tmdbId: Joi.number().integer().required(),
    title: Joi.string().required(),
    year: Joi.string().allow('', null),
    posterUrl: Joi.string().allow('', null),
    rating: Joi.number().min(0).max(10).required(),
    review: Joi.string().required(),
    watchedDate: Joi.date().allow(null),
  }),
};

const updateReview = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    rating: Joi.number().min(0).max(10),
    review: Joi.string(),
    watchedDate: Joi.date().allow(null),
  }),
};

const deleteReview = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
};

const getByMovie = {
  params: Joi.object({
    tmdbId: Joi.number().integer().positive().required(),
  }),
};

module.exports = { createReview, updateReview, deleteReview, getByMovie };
