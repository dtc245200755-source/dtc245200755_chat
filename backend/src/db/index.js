/**
 * PostgreSQL Database Connection Pool
 */

const { Pool } = require('pg');
const config = require('../config');
const logger = require('../logger');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  max: config.db.max,
  idleTimeoutMillis: config.db.idleTimeoutMillis,
  connectionTimeoutMillis: config.db.connectionTimeoutMillis,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', { error: err.message, stack: err.stack });
});

/**
 * Execute parameterized query safely
 * @param {string} text - SQL statement
 * @param {Array} params - Query parameters
 */
async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn('Slow database query detected', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    logger.error('Database query error', { text, error: error.message });
    throw error;
  }
}

/**
 * Health check for database connection
 * Returns true if DB is responsive
 */
async function checkHealth() {
  try {
    const result = await pool.query('SELECT 1 AS status');
    return result.rows[0].status === 1;
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return false;
  }
}

module.exports = {
  pool,
  query,
  checkHealth,
};
