/**
 * Application Configuration Module
 * Loads and validates environment variables.
 */

require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '3000', 10),
  
  // Database Configuration
  db: {
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'chat_db',
    user: process.env.DB_USER || 'chat_user',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '5000', 10),
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Security & Rate Limiting
  security: {
    corsOrigin: process.env.CORS_ORIGIN || '',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '200', 10),
    authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validate critical configurations (warn here; server.js enforces hard failure on start)
if (config.isProduction) {
  if (!config.jwt.secret) {
    console.warn('[SECURITY WARNING] JWT_SECRET is not set. Authentication is unsafe.');
  } else if (config.jwt.secret.length < 32) {
    console.warn('[SECURITY WARNING] JWT_SECRET is shorter than 32 characters. Use a longer random secret.');
  }
  if (!config.db.password) {
    console.warn('[SECURITY WARNING] DB_PASSWORD is not set. Database authentication is unsafe.');
  }
}

module.exports = config;
