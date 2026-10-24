/**
 * Messages Routes
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const messagesController = require('./messages.controller');
const { authenticateToken } = require('../../middleware/auth');
const { validateMessage } = require('../../middleware/validate');

router.use(authenticateToken);

router.get('/', messagesController.getRoomMessages);
router.post('/', validateMessage, messagesController.sendMessage);

module.exports = router;
