/**
 * Rooms Controller
 */

const roomsService = require('./rooms.service');

async function createRoom(req, res, next) {
  try {
    const { name, description, isPrivate } = req.sanitized;
    const room = await roomsService.createRoom({
      name,
      description,
      isPrivate,
      createdBy: req.user.id,
    });
    res.status(201).json({
      success: true,
      message: 'Room created successfully.',
      data: { room },
    });
  } catch (err) {
    next(err);
  }
}

async function listRooms(req, res, next) {
  try {
    const rooms = await roomsService.getRooms(req.user.id);
    res.status(200).json({
      success: true,
      data: { rooms },
    });
  } catch (err) {
    next(err);
  }
}

async function getRoom(req, res, next) {
  try {
    const roomId = parseInt(req.params.id, 10);
    if (isNaN(roomId)) {
      return res.status(400).json({ success: false, error: 'Invalid room ID.' });
    }
    const room = await roomsService.getRoomById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found.' });
    }
    if (room.is_private && req.user.role !== 'admin') {
      const isMember = await roomsService.isUserInRoom(roomId, req.user.id);
      if (!isMember) {
        return res.status(403).json({ success: false, error: 'You are not a member of this private room.' });
      }
    }
    res.status(200).json({
      success: true,
      data: { room },
    });
  } catch (err) {
    next(err);
  }
}

async function joinRoom(req, res, next) {
  try {
    const roomId = parseInt(req.params.id, 10);
    if (isNaN(roomId)) {
      return res.status(400).json({ success: false, error: 'Invalid room ID.' });
    }

    // Authorization: only admins may add another user to a room.
    // Regular users can only join a room as themselves (prevents IDOR).
    let targetUserId = req.user.id;
    if (req.body && req.body.userId != null) {
      const requestedId = parseInt(req.body.userId, 10);
      if (isNaN(requestedId)) {
        return res.status(400).json({ success: false, error: 'Invalid user ID.' });
      }
      if (requestedId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can add other users to a room.' });
      }
      targetUserId = requestedId;
    }

    const room = await roomsService.getRoomById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found.' });
    }

    // Private rooms: non-admin users must already be a member to (re)join.
    if (room.is_private && req.user.role !== 'admin' && !(await roomsService.isUserInRoom(roomId, targetUserId))) {
      return res.status(403).json({ success: false, error: 'You cannot join this private room.' });
    }

    const result = await roomsService.joinRoom(roomId, targetUserId);
    res.status(200).json({
      success: true,
      message: 'Joined room successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

async function leaveRoom(req, res, next) {
  try {
    const roomId = parseInt(req.params.id, 10);
    if (isNaN(roomId)) {
      return res.status(400).json({ success: false, error: 'Invalid room ID.' });
    }

    // Authorization: only admins may remove another user from a room.
    // Regular users can only leave a room as themselves (prevents IDOR).
    let targetUserId = req.user.id;
    if (req.body && req.body.userId != null) {
      const requestedId = parseInt(req.body.userId, 10);
      if (isNaN(requestedId)) {
        return res.status(400).json({ success: false, error: 'Invalid user ID.' });
      }
      if (requestedId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can remove other users from a room.' });
      }
      targetUserId = requestedId;
    }

    const result = await roomsService.leaveRoom(roomId, targetUserId);
    res.status(200).json({
      success: true,
      message: 'Left room successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

async function getMembers(req, res, next) {
  try {
    const roomId = parseInt(req.params.id, 10);
    if (isNaN(roomId)) {
      return res.status(400).json({ success: false, error: 'Invalid room ID.' });
    }
    const room = await roomsService.getRoomById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found.' });
    }
    if (room.is_private && req.user.role !== 'admin') {
      const isMember = await roomsService.isUserInRoom(roomId, req.user.id);
      if (!isMember) {
        return res.status(403).json({ success: false, error: 'You are not a member of this private room.' });
      }
    }
    const members = await roomsService.getRoomMembers(roomId);
    res.status(200).json({
      success: true,
      data: { members },
    });
  } catch (err) {
    next(err);
  }
}

async function deleteRoom(req, res, next) {
  try {
    const roomId = parseInt(req.params.id, 10);
    if (isNaN(roomId)) {
      return res.status(400).json({ success: false, error: 'Invalid room ID.' });
    }
    const result = await roomsService.deleteRoomById(roomId);
    res.status(200).json({
      success: true,
      message: 'Room deleted successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRoom,
  listRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  getMembers,
  deleteRoom,
};
