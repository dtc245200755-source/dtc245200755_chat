/**
 * Structured Logging Module (Winston)
 * Outputs JSON logs to stdout/stderr with automatic sanitization of sensitive fields.
 */

const winston = require('winston');
const config = require('../config');

// List of sensitive keys that must never appear in plaintext logs
const SENSITIVE_KEYS = [
  'password',
  'token',
  'jwt',
  'secret',
  'authorization',
  'cookie',
  'set-cookie',
  'password_hash',
  'db_password',
];

/**
 * Recursively redacts sensitive keys from log metadata objects
 */
function sanitize(obj, visited = new WeakSet()) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (visited.has(obj)) {
    return '[Circular]';
  }
  visited.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, visited));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value, visited);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const sanitizeFormat = winston.format((info) => {
  const clean = sanitize(info);
  return clean;
});

const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: {
    service: 'chat-app',
    env: config.env,
  },
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    sanitizeFormat(),
    winston.format.errors({ stack: true }),
    config.isProduction
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] [${service}] [${level.toUpperCase()}]: ${message}${metaStr}`;
        })
  ),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

module.exports = logger;
