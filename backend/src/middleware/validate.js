/**
 * Input Validation Middleware Helper
 */

/**
 * Validates user registration payload
 */
function validateRegister(req, res, next) {
  const { username, password, email, displayName } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
    return res.status(400).json({
      success: false,
      error: 'Username must be between 3 and 30 characters.',
    });
  }

  // Username alphanumeric and underscores only
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Username can only contain letters, numbers, and underscores.',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Password must be between 6 and 100 characters.',
    });
  }

  if (email && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address format.',
    });
  }

  req.sanitized = {
    username: username.trim(),
    password,
    email: email ? email.trim().toLowerCase() : null,
    displayName: displayName && typeof displayName === 'string' ? displayName.trim().slice(0, 50) : username.trim(),
  };

  next();
}

/**
 * Validates user login payload
 */
function validateLogin(req, res, next) {
  const { username, password } = req.body;

  if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required.',
    });
  }

  req.sanitized = {
    username: username.trim(),
    password,
  };

  next();
}

/**
 * Validates room creation payload
 */
function validateCreateRoom(req, res, next) {
  const { name, description, isPrivate } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
    return res.status(400).json({
      success: false,
      error: 'Room name must be between 2 and 50 characters.',
    });
  }

  req.sanitized = {
    name: name.trim(),
    description: description && typeof description === 'string' ? description.trim().slice(0, 200) : '',
    isPrivate: Boolean(isPrivate),
  };

  next();
}

/**
 * Validates chat message payload
 */
function validateMessage(req, res, next) {
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Message content cannot be empty.',
    });
  }

  if (content.length > 2000) {
    return res.status(400).json({
      success: false,
      error: 'Message content exceeds maximum allowed length of 2000 characters.',
    });
  }

  req.sanitized = {
    content: content.trim(),
  };

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateRoom,
  validateMessage,
};
