/**
 * Master Application Routes
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const roomsRoutes = require('../modules/rooms/rooms.routes');
const messagesRoutes = require('../modules/messages/messages.routes');
const { metricsEndpoint } = require('../metrics');
const db = require('../db');

// Health Check Endpoint
router.get('/health', async (req, res) => {
  const isDbHealthy = await db.checkHealth();
  const status = isDbHealthy ? 'UP' : 'DEGRADED';
  const statusCode = isDbHealthy ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      app: 'UP',
      database: isDbHealthy ? 'UP' : 'DOWN',
    },
  });
});

// Prometheus Metrics Endpoint
router.get('/metrics', metricsEndpoint);

// API Modules
router.use('/api/auth', authRoutes);
router.use('/api/users', usersRoutes);
router.use('/api/rooms', roomsRoutes);
router.use('/api/rooms/:roomId/messages', messagesRoutes);

module.exports = router;
