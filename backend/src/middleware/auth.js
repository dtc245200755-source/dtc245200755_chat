/**
 * Authentication Middleware
 * Validates JWT tokens on incoming HTTP requests.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../logger');

/**
 * Middleware to authenticate requests via Bearer JWT or cookie
 */
function authenticateToken(req, res, next) {
  let token = null;

  // 1. Check Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Check cookies if cookie-parser is used
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required. Please log in.',
    });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      logger.warn('Token verification failed', { error: err.name, message: err.message });
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Session expired. Please log in again.',
        });
      }
      return res.status(403).json({
        success: false,
        error: 'Invalid or malformed token.',
      });
    }

    req.user = user;
    next();
  });
}

/**
 * Middleware to restrict a route to administrators.
 * Must be used after `authenticateToken` (relies on req.user).
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required.',
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
};
