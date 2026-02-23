const errorHandler = (err, req, res, next) => {
  // Only log unexpected errors (not operational ones like validation/auth failures)
  if (!err.isOperational) {
    console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);
  }

  // Known operational errors (AppError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry' });
  }

  // Unknown / programming errors
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorHandler;
