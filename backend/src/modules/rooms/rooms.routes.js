/**
 * Rooms Routes
 */

const express = require('express');
const router = express.Router();
const roomsController = require('./rooms.controller');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const { validateCreateRoom } = require('../../middleware/validate');

router.use(authenticateToken);

router.post('/', validateCreateRoom, roomsController.createRoom);
router.get('/', roomsController.listRooms);
router.get('/:id', roomsController.getRoom);
router.post('/:id/join', roomsController.joinRoom);
router.post('/:id/leave', roomsController.leaveRoom);
router.get('/:id/members', roomsController.getMembers);

// Admin-only: delete a room (cascades to its messages and memberships).
router.delete('/:id', requireAdmin, roomsController.deleteRoom);

module.exports = router;
