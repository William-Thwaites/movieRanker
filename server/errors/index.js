const AppError = require('./AppError');

const badRequest = (msg) => new AppError(msg, 400);
const unauthorized = (msg = 'Unauthorized') => new AppError(msg, 401);
const notFound = (msg = 'Not found') => new AppError(msg, 404);
const conflict = (msg) => new AppError(msg, 409);

module.exports = { AppError, badRequest, unauthorized, notFound, conflict };
