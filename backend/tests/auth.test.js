/**
 * Unit Tests: Authentication & Password Hashing
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

test('Authentication Module Tests', async (t) => {
  await t.test('bcrypt hashes and verifies password correctly', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await bcrypt.hash(rawPassword, 10);

    assert.notEqual(rawPassword, hash, 'Hash must not equal raw password');
    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.equal(isMatch, true, 'bcrypt.compare should return true for valid password');

    const isWrong = await bcrypt.compare('WrongPassword456', hash);
    assert.equal(isWrong, false, 'bcrypt.compare should return false for incorrect password');
  });

  await t.test('jwt signs and verifies token payload correctly', () => {
    const secret = 'test_secret_key_12345';
    const payload = { id: 1, username: 'testuser', role: 'member' };

    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    assert.ok(typeof token === 'string', 'Token should be a string');

    const decoded = jwt.verify(token, secret);
    assert.equal(decoded.id, 1);
    assert.equal(decoded.username, 'testuser');
    assert.equal(decoded.role, 'member');
  });
});
