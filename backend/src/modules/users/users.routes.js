/**
 * Users Routes
 */

const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

router.use(authenticateToken);

// Admin-only: full user directory (including email addresses).
router.get('/admin/users', requireAdmin, usersController.listUsers);

// User search
router.get('/search', usersController.searchUsers);

// Profile management
router.put('/profile', usersController.updateProfile);
router.put('/change-password', usersController.changePassword);

// List and get user
router.get('/', usersController.listUsers);
router.get('/:id', usersController.getProfile);

// Admin-only: delete a user account (cannot delete self).
router.delete('/:id', requireAdmin, usersController.deleteUser);

module.exports = router;
