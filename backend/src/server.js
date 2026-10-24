/**
 * Server Entrypoint
 * Creates HTTP server, attaches Socket.IO, and manages graceful shutdown.
 */

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');
const logger = require('./logger');
const db = require('./db');
const { initializeSocket } = require('./socket');

// Fail fast if critical secrets are missing in production (avoid running with defaults)
if (config.isProduction && (!config.jwt.secret || !config.db.password)) {
  logger.error('Refusing to start: JWT_SECRET and DB_PASSWORD are required in production.');
  process.exit(1);
}

const server = http.createServer(app);

// Socket.IO CORS follows the configured allow-list (same policy as the REST API)
const socketCorsOrigin = config.security.corsOrigin === '*'
  ? '*'
  : String(config.security.corsOrigin || '').split(',').map((s) => s.trim()).filter(Boolean);

// Initialize Socket.IO engine
const io = new Server(server, {
  cors: {
    origin: socketCorsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 15000,
  transports: ['websocket', 'polling'],
});

initializeSocket(io);

// Start server
server.listen(config.port, async () => {
  logger.info(`Chat system server started successfully`, {
    port: config.port,
    env: config.env,
  });

  // Test DB connection on startup
  const isHealthy = await db.checkHealth();
  if (isHealthy) {
    logger.info('Database connection established successfully');
  } else {
    logger.error('Database connection failed on startup. Retrying in background...');
  }
});

// Graceful shutdown handling
async function shutdown(signal) {
  logger.info(`Received ${signal}. Gracefully shutting down...`);

  // Close HTTP and Socket connections
  server.close(async () => {
    logger.info('HTTP server closed.');

    // Close PostgreSQL pool
    try {
      await db.pool.end();
      logger.info('Database pool drained.');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing database pool', { error: err.message });
      process.exit(1);
    }
  });

  // Force shutdown after timeout if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
