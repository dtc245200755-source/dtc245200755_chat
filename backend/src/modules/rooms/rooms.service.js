/**
 * Rooms Service
 */

const db = require('../../db');
const logger = require('../../logger');

/**
 * Create a new chat room and add the creator as the first member
 */
async function createRoom({ name, description, isPrivate, createdBy }) {
  // Check if room name already exists
  const existing = await db.query('SELECT id FROM rooms WHERE name = $1', [name]);
  if (existing.rows.length > 0) {
    const error = new Error('A room with this name already exists.');
    error.status = 409;
    throw error;
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const roomRes = await client.query(
      `INSERT INTO rooms (name, description, is_private, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, is_private, created_by, created_at`,
      [name, description, isPrivate, createdBy]
    );
    const newRoom = roomRes.rows[0];

    // Automatically add creator to room_members
    await client.query(
      `INSERT INTO room_members (room_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (room_id, user_id) DO NOTHING`,
      [newRoom.id, createdBy]
    );

    await client.query('COMMIT');
    logger.info('Chat room created', { roomId: newRoom.id, name: newRoom.name, createdBy });
    return newRoom;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * List all available rooms for a user
 */
async function getRooms(userId) {
  const result = await db.query(
    `SELECT 
        r.id, 
        r.name, 
        r.description, 
        r.is_private, 
        r.created_by, 
        r.created_at,
        COUNT(DISTINCT rm.user_id)::int AS member_count,
        BOOL_OR(rm.user_id = $1) AS is_member
     FROM rooms r
     LEFT JOIN room_members rm ON r.id = rm.room_id
     WHERE r.is_private = FALSE OR r.id IN (
       SELECT room_id FROM room_members WHERE user_id = $1
     )
     GROUP BY r.id
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Get room by ID
 */
async function getRoomById(roomId) {
  const result = await db.query(
    `SELECT r.id, r.name, r.description, r.is_private, r.created_by, r.created_at,
            COUNT(DISTINCT rm.user_id)::int AS member_count
     FROM rooms r
     LEFT JOIN room_members rm ON r.id = rm.room_id
     WHERE r.id = $1
     GROUP BY r.id`,
    [roomId]
  );
  return result.rows[0] || null;
}

/**
 * Join a room
 */
async function joinRoom(roomId, userId) {
  const room = await getRoomById(roomId);
  if (!room) {
    const error = new Error('Room not found.');
    error.status = 404;
    throw error;
  }

  await db.query(
    `INSERT INTO room_members (room_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (room_id, user_id) DO NOTHING`,
    [roomId, userId]
  );

  logger.info('User joined room', { roomId, userId });
  return { roomId, userId, joined: true };
}

/**
 * Leave a room
 */
async function leaveRoom(roomId, userId) {
  await db.query(
    `DELETE FROM room_members
     WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId]
  );

  logger.info('User left room', { roomId, userId });
  return { roomId, userId, left: true };
}

/**
 * Get members of a room
 */
async function getRoomMembers(roomId) {
  const result = await db.query(
    `SELECT u.id, u.username, u.display_name, u.role, rm.joined_at
     FROM room_members rm
     JOIN users u ON rm.user_id = u.id
     WHERE rm.room_id = $1
     ORDER BY rm.joined_at ASC`,
    [roomId]
  );
  return result.rows;
}

/**
 * Check if a user is a member of a room
 */
async function isUserInRoom(roomId, userId) {
  const result = await db.query(
    `SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId]
  );
  return result.rows.length > 0;
}

/**
 * Delete a chat room and all of its data (admin only).
 * FK constraints cascade: room_members and messages referencing this room
 * are removed automatically.
 */
async function deleteRoomById(roomId) {
  const result = await db.query(
    `DELETE FROM rooms WHERE id = $1 RETURNING id, name`,
    [roomId]
  );
  if (result.rows.length === 0) {
    const error = new Error('Room not found.');
    error.status = 404;
    throw error;
  }
  logger.info('Chat room deleted', { roomId, name: result.rows[0].name });
  return { success: true, deleted: result.rows[0] };
}

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  leaveRoom,
  getRoomMembers,
  isUserInRoom,
  deleteRoomById,
};
