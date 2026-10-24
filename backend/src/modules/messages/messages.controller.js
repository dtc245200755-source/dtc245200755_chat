/**
 * Messages Controller
 */

const messagesService = require('./messages.service');
const roomsService = require('../rooms/rooms.service');
const { messagesSentTotal } = require('../../metrics');

async function getRoomMessages(req, res, next) {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    if (isNaN(roomId)) {
      return res.status(400).json({ success: false, error: 'Invalid room ID.' });
    }

    const room = await roomsService.getRoomById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found.' });
    }

    // Check membership if room is private
    if (room.is_private) {
      const isMember = await roomsService.isUserInRoom(roomId, req.user.id);
      if (!isMember) {
        return res.status(403).json({ success: false, error: 'You are not a member of this private room.' });
      }
    }

    const { limit, beforeId } = req.query;
    const messages = await messagesService.getMessages({
      roomId,
      limit,
      beforeId: beforeId ? parseInt(beforeId, 10) : null,
    });

    res.status(200).json({
      success: true,
      data: { messages },
    });
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    if (isNaN(roomId)) {
      return res.status(400).json({ success: false, error: 'Invalid room ID.' });
    }

    const room = await roomsService.getRoomById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found.' });
    }

    // Check membership
    const isMember = await roomsService.isUserInRoom(roomId, req.user.id);
    if (!isMember) {
      // Auto-join public room if not a member yet
      if (!room.is_private) {
        await roomsService.joinRoom(roomId, req.user.id);
      } else {
        return res.status(403).json({ success: false, error: 'You are not a member of this private room.' });
      }
    }

    const { content } = req.sanitized;
    const message = await messagesService.saveMessage({
      roomId,
      userId: req.user.id,
      content,
    });

    // Increment metrics
    messagesSentTotal.inc({ room_id: String(roomId) });

    res.status(201).json({
      success: true,
      data: { message },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRoomMessages,
  sendMessage,
};
