/**
 * Socket.IO Client Wrapper
 */

const chatSocket = {
  socket: null,

  init(token, onConnectChange) {
    if (this.socket) {
      this.socket.disconnect();
    }

    if (typeof io === 'undefined') {
      console.warn('Socket.io library not loaded');
      return;
    }

    this.socket = io({
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server with ID:', this.socket.id);
      if (onConnectChange) onConnectChange(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      if (onConnectChange) onConnectChange(false);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection Error:', err.message);
      if (onConnectChange) onConnectChange(false);
      if (err.message.includes('Authentication')) {
        window.api.clearAuth();
        window.location.href = '/login.html';
      }
    });
  },

  joinRoom(roomId, callback) {
    if (!this.socket) return;
    this.socket.emit('room:join', { roomId }, callback);
  },

  leaveRoom(roomId) {
    if (!this.socket) return;
    this.socket.emit('room:leave', { roomId });
  },

  sendMessage(roomId, content, callback) {
    if (!this.socket) return;
    this.socket.emit('chat:message', { roomId, content }, callback);
  },

  startTyping(roomId) {
    if (!this.socket) return;
    this.socket.emit('typing:start', { roomId });
  },

  stopTyping(roomId) {
    if (!this.socket) return;
    this.socket.emit('typing:stop', { roomId });
  },

  onNewMessage(handler) {
    if (!this.socket) return;
    this.socket.off('chat:message');
    this.socket.on('chat:message', handler);
  },

  onUserJoined(handler) {
    if (!this.socket) return;
    this.socket.off('user:joined');
    this.socket.on('user:joined', handler);
  },

  onUserLeft(handler) {
    if (!this.socket) return;
    this.socket.off('user:left');
    this.socket.on('user:left', handler);
  },

  onUserTyping(handler) {
    if (!this.socket) return;
    this.socket.off('user:typing');
    this.socket.on('user:typing', handler);
  },
};

window.chatSocket = chatSocket;
