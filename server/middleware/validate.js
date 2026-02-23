const { badRequest } = require('../errors');

/**
 * Validation middleware factory.
 * @param {object} schema - Object with optional keys: body, query, params.
 *   Each value is a Joi schema.
 */
const validate = (schema) => (req, res, next) => {
  const targets = ['body', 'query', 'params'];

  for (const target of targets) {
    if (schema[target]) {
      const { error, value } = schema[target].validate(req[target], {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        const message = error.details.map(d => d.message).join(', ');
        return next(badRequest(message));
      }
      req[target] = value;
    }
  }
  next();
};

module.exports = validate;
