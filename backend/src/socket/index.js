/**
 * Socket.IO Handler
 * Real-time messaging, room joining, typing indicators, and authentication.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../logger');
const messagesService = require('../modules/messages/messages.service');
const roomsService = require('../modules/rooms/rooms.service');
const { socketConnectionsActive, messagesSentTotal } = require('../metrics');

function parseCookie(cookieString, cookieName) {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp('(^|;\\s*)(' + cookieName + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Initialize Socket.IO with HTTP server
 */
function initializeSocket(io) {
  // Authentication Middleware for Socket.IO
  io.use((socket, next) => {
    let token = socket.handshake.auth ? socket.handshake.auth.token : null;

    if (!token && socket.handshake.headers.cookie) {
      token = parseCookie(socket.handshake.headers.cookie, 'token');
    }

    if (!token && socket.handshake.query && socket.handshake.query.token) {
      token = socket.handshake.query.token;
    }

    if (!token) {
      logger.warn('Socket connection rejected: No authentication token provided');
      return next(new Error('Authentication error: Token required.'));
    }

    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        logger.warn('Socket connection rejected: Invalid token', { error: err.message });
        return next(new Error('Authentication error: Invalid or expired token.'));
      }
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    socketConnectionsActive.inc();
    const user = socket.user;
    logger.info('Socket client connected', { socketId: socket.id, userId: user.id, username: user.username });

    // Join a room
    socket.on('room:join', async ({ roomId }, callback) => {
      try {
        const id = parseInt(roomId, 10);
        if (isNaN(id)) {
          if (typeof callback === 'function') callback({ success: false, error: 'Invalid room ID.' });
          return;
        }

        const room = await roomsService.getRoomById(id);
        if (!room) {
          if (typeof callback === 'function') callback({ success: false, error: 'Room does not exist.' });
          return;
        }

        // If private, ensure user is a member
        if (room.is_private) {
          const isMember = await roomsService.isUserInRoom(id, user.id);
          if (!isMember) {
            if (typeof callback === 'function') callback({ success: false, error: 'Access denied: Private room.' });
            return;
          }
        } else {
          // Auto-join public room in DB
          await roomsService.joinRoom(id, user.id);
        }

        const roomChannel = `room_${id}`;
        socket.join(roomChannel);

        // Notify other room members
        socket.to(roomChannel).emit('user:joined', {
          roomId: id,
          user: { id: user.id, username: user.username, displayName: user.displayName },
          timestamp: new Date().toISOString(),
        });

        logger.info('User joined socket room', { socketId: socket.id, roomChannel, userId: user.id });

        if (typeof callback === 'function') {
          callback({ success: true, room });
        }
      } catch (err) {
        logger.error('Error joining socket room', { error: err.message, userId: user.id });
        if (typeof callback === 'function') callback({ success: false, error: 'Failed to join room.' });
      }
    });

    // Leave a room
    socket.on('room:leave', ({ roomId }) => {
      const id = parseInt(roomId, 10);
      if (!isNaN(id)) {
        const roomChannel = `room_${id}`;
        socket.leave(roomChannel);
        socket.to(roomChannel).emit('user:left', {
          roomId: id,
          user: { id: user.id, username: user.username },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Send a message in room
    socket.on('chat:message', async ({ roomId, content }, callback) => {
      try {
        const id = parseInt(roomId, 10);
        if (isNaN(id)) {
          if (typeof callback === 'function') callback({ success: false, error: 'Invalid room ID.' });
          return;
        }

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          if (typeof callback === 'function') callback({ success: false, error: 'Message cannot be empty.' });
          return;
        }

        if (content.length > 2000) {
          if (typeof callback === 'function') callback({ success: false, error: 'Message is too long (max 2000 chars).' });
          return;
        }

        // Authorization: verify the room exists and the sender may post to it.
        // Mirrors the REST authorization in messages.controller.js so a socket
        // client cannot bypass the membership check for private rooms.
        const room = await roomsService.getRoomById(id);
        if (!room) {
          if (typeof callback === 'function') callback({ success: false, error: 'Room does not exist.' });
          return;
        }
        if (room.is_private) {
          const isMember = await roomsService.isUserInRoom(id, user.id);
          if (!isMember) {
            if (typeof callback === 'function') callback({ success: false, error: 'Access denied: you are not a member of this private room.' });
            return;
          }
        } else {
          // Auto-join public room in DB (consistent with REST behavior)
          await roomsService.joinRoom(id, user.id);
        }

        // Save message to PostgreSQL
        const savedMessage = await messagesService.saveMessage({
          roomId: id,
          userId: user.id,
          content: content.trim(),
        });

        // Increment Prometheus counter
        messagesSentTotal.inc({ room_id: String(id) });

        // Broadcast to all clients in the room including sender
        const roomChannel = `room_${id}`;
        io.to(roomChannel).emit('chat:message', savedMessage);

        if (typeof callback === 'function') {
          callback({ success: true, message: savedMessage });
        }
      } catch (err) {
        logger.error('Error broadcasting socket message', { error: err.message, userId: user.id });
        if (typeof callback === 'function') callback({ success: false, error: 'Failed to send message.' });
      }
    });

    // Typing indicator
    socket.on('typing:start', ({ roomId }) => {
      const id = parseInt(roomId, 10);
      if (!isNaN(id)) {
        socket.to(`room_${id}`).emit('user:typing', {
          roomId: id,
          username: user.username,
          displayName: user.displayName,
          isTyping: true,
        });
      }
    });

    socket.on('typing:stop', ({ roomId }) => {
      const id = parseInt(roomId, 10);
      if (!isNaN(id)) {
        socket.to(`room_${id}`).emit('user:typing', {
          roomId: id,
          username: user.username,
          displayName: user.displayName,
          isTyping: false,
        });
      }
    });

    // Disconnect event
    socket.on('disconnect', (reason) => {
      socketConnectionsActive.dec();
      logger.info('Socket client disconnected', { socketId: socket.id, userId: user.id, reason });
    });
  });
}

module.exports = {
  initializeSocket,
};
