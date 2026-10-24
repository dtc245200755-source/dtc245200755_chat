/**
 * Prometheus Metrics Instrumentation
 * Collects Node.js runtime metrics and chat application metrics.
 */

const client = require('prom-client');

// Initialize default recommended Prometheus metrics (CPU, Memory, Event Loop, GC)
const register = new client.Registry();
client.collectDefaultMetrics({
  register,
  prefix: 'chat_app_',
});

// Custom Metrics: HTTP Requests Total
const httpRequestsTotal = new client.Counter({
  name: 'chat_http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

// Custom Metrics: HTTP Request Duration
const httpRequestDurationSeconds = new client.Histogram({
  name: 'chat_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDurationSeconds);

// Custom Metrics: Active Socket.IO Connections
const socketConnectionsActive = new client.Gauge({
  name: 'chat_socket_connections_active',
  help: 'Number of active Socket.IO client connections',
});
register.registerMetric(socketConnectionsActive);

// Custom Metrics: Messages Sent Counter (anonymized, no message body or user PII)
const messagesSentTotal = new client.Counter({
  name: 'chat_messages_sent_total',
  help: 'Total number of chat messages sent through Socket.IO or REST',
  labelNames: ['room_id'],
});
register.registerMetric(messagesSentTotal);

// Custom Metrics: Active Chat Rooms Count
const activeRoomsCount = new client.Gauge({
  name: 'chat_active_rooms_count',
  help: 'Number of currently active chat rooms with at least one member',
});
register.registerMetric(activeRoomsCount);

/**
 * Express middleware to track HTTP request metrics
 */
function metricsMiddleware(req, res, next) {
  // Avoid tracking metrics for /metrics itself to avoid noise
  if (req.path === '/metrics') {
    return next();
  }

  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    // Bound the route label to avoid unbounded cardinality from unmatched paths.
    const route = req.route ? req.route.path : 'unmatched';
    const labels = {
      method: req.method,
      route: route || 'unknown',
      status_code: res.statusCode,
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationInSeconds);
  });

  next();
}

/**
 * Endpoint handler to serve Prometheus scrape metrics
 */
async function metricsEndpoint(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
}

module.exports = {
  register,
  metricsMiddleware,
  metricsEndpoint,
  socketConnectionsActive,
  messagesSentTotal,
  activeRoomsCount,
};
