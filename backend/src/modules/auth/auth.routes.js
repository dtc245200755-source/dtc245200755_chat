/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authLimiter } = require('../../middleware/rateLimiter');
const { validateRegister, validateLogin } = require('../../middleware/validate');
const { authenticateToken } = require('../../middleware/auth');

router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
