/**
 * Messages Service
 */

const db = require('../../db');
const logger = require('../../logger');

/**
 * Save a new message to the database
 */
async function saveMessage({ roomId, userId, content }) {
  const result = await db.query(
    `INSERT INTO messages (room_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, room_id, user_id, content, created_at`,
    [roomId, userId, content]
  );

  const message = result.rows[0];

  // Fetch sender details for real-time broadcast and response
  const userResult = await db.query(
    `SELECT username, display_name FROM users WHERE id = $1`,
    [userId]
  );

  const sender = userResult.rows[0] || { username: 'Unknown', display_name: 'Unknown' };

  const messageWithSender = {
    ...message,
    username: sender.username,
    displayName: sender.display_name,
  };

  logger.info('Message saved', { messageId: message.id, roomId, userId });
  return messageWithSender;
}

/**
 * Fetch message history for a specific room with pagination/limit
 * @param {Object} options
 * @param {number} options.roomId
 * @param {number} [options.limit=50]
 * @param {number} [options.beforeId] - Cursor pagination
 */
async function getMessages({ roomId, limit = 50, beforeId = null }) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

  let queryText = `
    SELECT 
      m.id,
      m.room_id,
      m.user_id,
      m.content,
      m.created_at,
      u.username,
      u.display_name AS "displayName"
    FROM messages m
    LEFT JOIN users u ON m.user_id = u.id
    WHERE m.room_id = $1
  `;
  const params = [roomId];

  if (beforeId) {
    queryText += ` AND m.id < $2`;
    params.push(beforeId);
  }

  queryText += ` ORDER BY m.created_at DESC, m.id DESC LIMIT $${params.length + 1}`;
  params.push(safeLimit);

  const result = await db.query(queryText, params);

  // Return in chronological order (oldest to newest) for front-end rendering
  return result.rows.reverse();
}

module.exports = {
  saveMessage,
  getMessages,
};
