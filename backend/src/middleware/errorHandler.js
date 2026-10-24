/**
 * Centralized Error Handling Middleware
 */

const logger = require('../logger');
const config = require('../config');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  // Handle common database errors
  if (err.code === '23505') {
    // PostgreSQL unique constraint violation
    return res.status(409).json({
      success: false,
      error: 'A record with this identifier already exists (Conflict).',
      detail: config.isProduction ? undefined : err.detail,
    });
  }

  if (err.code === '23503') {
    // PostgreSQL foreign key violation
    return res.status(400).json({
      success: false,
      error: 'Referenced entity does not exist.',
    });
  }

  // Log 5xx errors as errors, 4xx as warnings
  if (status >= 500) {
    logger.error('Unhandled Server Error', {
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      stack: err.stack,
    });
  } else {
    logger.warn('Client Request Error', {
      method: req.method,
      url: req.originalUrl,
      status,
      message: err.message,
    });
  }

  // Avoid leaking internal error messages/stack details to clients in production.
  const isServerError = status >= 500;
  const clientError = isServerError && config.isProduction
    ? 'Internal Server Error'
    : (err.message || 'Internal Server Error');

  res.status(status).json({
    success: false,
    error: clientError,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
}

// 404 Handler for undefined API routes
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
