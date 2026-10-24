/**
 * Users Controller
 */

const usersService = require('./users.service');

/**
 * Strip the email field for non-admin callers so the public directory does
 * not leak contact addresses. Admins receive the full record.
 */
function sanitizeUserFor(user, isAdmin) {
  if (isAdmin) return user;
  const { email, ...rest } = user;
  return rest;
}

async function listUsers(req, res, next) {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const users = (await usersService.getAllUsers()).map((u) => sanitizeUserFor(u, isAdmin));
    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'Mã người dùng không hợp lệ.' });
    }
    const user = await usersService.getUserProfile(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng.' });
    }
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { displayName, email } = req.body;
    const updated = await usersService.updateProfile(userId, { displayName, email });
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công.',
      data: { user: updated },
    });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.',
      });
    }
    const result = await usersService.changePassword(userId, { currentPassword, newPassword });
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
}

async function searchUsers(req, res, next) {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const q = req.query.q || '';
    const users = (await usersService.searchUsers(q)).map((u) => sanitizeUserFor(u, isAdmin));
    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ success: false, error: 'Mã người dùng không hợp lệ.' });
    }
    if (targetUserId === req.user.id) {
      return res.status(403).json({ success: false, error: 'Bạn không thể xóa chính tài khoản của mình.' });
    }
    const result = await usersService.deleteUserById(targetUserId);
    res.status(200).json({
      success: true,
      message: 'Đã xóa tài khoản người dùng.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  getProfile,
  updateProfile,
  changePassword,
  searchUsers,
  deleteUser,
};
