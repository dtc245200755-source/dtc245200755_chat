/**
 * Express Application Configuration
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { metricsMiddleware } = require('./metrics');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const config = require('./config');

const app = express();

// Trust the first proxy hop (Nginx) so req.ip reflects the real client IP.
// Required for per-client rate limiting and correct client IP reporting.
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.socket.io'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Cross-Origin Resource Sharing — configurable allow-list (no wildcard reflection)
const allowedOrigins = String(config.security.corsOrigin || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin / non-browser requests, and origins in the allow-list.
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

// Body parsing with size limitations to prevent DoS
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// Prometheus Metrics Middleware
app.use(metricsMiddleware);

const fs = require('fs');

// Resolve frontend directory path (supporting separate frontend/ directory or app/public)
const frontendPath = fs.existsSync(path.join(__dirname, '../../frontend'))
  ? path.join(__dirname, '../../frontend')
  : path.join(__dirname, '../public');

// Serve static frontend assets
app.use(express.static(frontendPath));

// Rate Limiter for API endpoints
app.use('/api', apiLimiter);

// API and Health Routes
app.use(routes);

// 404 handler for unmatched API routes
app.use('/api/*', notFoundHandler);

// Fallback to index.html for SPA frontend routing if accessed directly
app.get('*', (req, res, next) => {
  if (req.accepts('html')) {
    const indexPath = fs.existsSync(path.join(frontendPath, 'index.html'))
      ? path.join(frontendPath, 'index.html')
      : path.join(__dirname, '../public/index.html');
    res.sendFile(indexPath);
  } else {
    next();
  }
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
