/**
 * Users Service
 */

const bcrypt = require('bcryptjs');
const db = require('../../db');
const logger = require('../../logger');

const SALT_ROUNDS = 10;

async function getAllUsers() {
  const result = await db.query(
    `SELECT id, username, email, display_name, role, created_at
     FROM users
     ORDER BY username ASC`
  );
  return result.rows;
}

async function getUserProfile(userId) {
  const result = await db.query(
    `SELECT id, username, email, display_name, role, created_at
     FROM users
     WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Update user display name and/or email
 */
async function updateProfile(userId, { displayName, email }) {
  const updates = [];
  const params = [];

  if (displayName !== undefined && displayName !== null) {
    params.push(displayName.trim().slice(0, 50));
    updates.push(`display_name = $${params.length}`);
  }

  if (email !== undefined && email !== null) {
    const cleanEmail = email.trim().toLowerCase();
    // Check if email already in use by another user
    const existing = await db.query(
      `SELECT id FROM users WHERE email = $1 AND id != $2`,
      [cleanEmail, userId]
    );
    if (existing.rows.length > 0) {
      const err = new Error('Email đã được sử dụng bởi tài khoản khác.');
      err.status = 409;
      throw err;
    }
    params.push(cleanEmail);
    updates.push(`email = $${params.length}`);
  }

  if (updates.length === 0) {
    return getUserProfile(userId);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(userId);

  const queryText = `
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = $${params.length}
    RETURNING id, username, email, display_name, role, created_at, updated_at
  `;

  const result = await db.query(queryText, params);
  logger.info('User profile updated successfully', { userId });
  return result.rows[0];
}

/**
 * Change password verifying old password with bcrypt
 */
async function changePassword(userId, { currentPassword, newPassword }) {
  const userRes = await db.query(
    `SELECT id, password_hash FROM users WHERE id = $1`,
    [userId]
  );

  if (userRes.rows.length === 0) {
    const err = new Error('Người dùng không tồn tại.');
    err.status = 404;
    throw err;
  }

  const user = userRes.rows[0];
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    const err = new Error('Mật khẩu hiện tại không chính xác.');
    err.status = 400;
    throw err;
  }

  if (!newPassword || newPassword.length < 6) {
    const err = new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
    err.status = 400;
    throw err;
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.query(
    `UPDATE users
     SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [newHash, userId]
  );

  logger.info('User password changed successfully', { userId });
  return { success: true, message: 'Đổi mật khẩu thành công.' };
}

/**
 * Search users by username or display_name
 */
async function searchUsers(keyword) {
  const clean = `%${(keyword || '').trim().toLowerCase()}%`;
  const result = await db.query(
    `SELECT id, username, email, display_name, role, created_at
     FROM users
     WHERE LOWER(username) LIKE $1 OR LOWER(display_name) LIKE $1
     ORDER BY username ASC
     LIMIT 20`,
    [clean]
  );
  return result.rows;
}

/**
 * Delete a user account (admin only).
 * FK constraints handle the cleanup: room_members CASCADE, messages.user_id -> NULL
 * (message history is kept but anonymized), rooms.created_by -> NULL.
 */
async function deleteUserById(userId) {
  const result = await db.query(
    `DELETE FROM users WHERE id = $1 RETURNING id, username, display_name`,
    [userId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Người dùng không tồn tại.');
    err.status = 404;
    throw err;
  }
  logger.info('User deleted', { userId, username: result.rows[0].username });
  return { success: true, deleted: result.rows[0] };
}

module.exports = {
  getAllUsers,
  getUserProfile,
  updateProfile,
  changePassword,
  searchUsers,
  deleteUserById,
};
