/**
 * Authentication Service
 * Handles password hashing, verification, user creation, and JWT issuance.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db');
const config = require('../../config');
const logger = require('../../logger');

const SALT_ROUNDS = 10;

/**
 * Register a new user
 */
async function registerUser({ username, password, email, displayName }) {
  // Check if username already exists
  const existing = await db.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) {
    const error = new Error('Username already taken.');
    error.status = 409;
    throw error;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user. The role is hard-coded to 'member' so that self-registration
  // can never escalate a new account to admin, regardless of schema defaults.
  const result = await db.query(
    `INSERT INTO users (username, password_hash, email, display_name, role)
     VALUES ($1, $2, $3, $4, 'member')
     RETURNING id, username, email, display_name, role, created_at`,
    [username, passwordHash, email, displayName || username]
  );

  const newUser = result.rows[0];
  logger.info('User registered successfully', { userId: newUser.id, username: newUser.username });
  return newUser;
}

/**
 * Authenticate user with credentials and issue JWT
 */
async function loginUser({ username, password }) {
  const result = await db.query(
    `SELECT id, username, password_hash, email, display_name, role
     FROM users
     WHERE username = $1`,
    [username]
  );

  if (result.rows.length === 0) {
    const error = new Error('Invalid username or password.');
    error.status = 401;
    throw error;
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    logger.warn('Failed login attempt', { username });
    const error = new Error('Invalid username or password.');
    error.status = 401;
    throw error;
  }

  // Generate JWT token
  const payload = {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
  };

  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  logger.info('User logged in successfully', { userId: user.id, username: user.username });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    },
  };
}

/**
 * Get current user profile by ID
 */
async function getUserById(userId) {
  const result = await db.query(
    `SELECT id, username, email, display_name, role, created_at
     FROM users
     WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
