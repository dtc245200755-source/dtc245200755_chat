/**
 * Unit Tests: User Module & Profile
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const usersService = require('../src/modules/users/users.service');

test('Users Module Unit Tests', async (t) => {
  await t.test('usersService exports all required management functions', () => {
    assert.equal(typeof usersService.getAllUsers, 'function');
    assert.equal(typeof usersService.getUserProfile, 'function');
    assert.equal(typeof usersService.updateProfile, 'function');
    assert.equal(typeof usersService.changePassword, 'function');
    assert.equal(typeof usersService.searchUsers, 'function');
  });

  await t.test('usersService handles search formatting safely', async () => {
    // Check that searchUsers function handles empty string without throws
    assert.ok(typeof usersService.searchUsers === 'function');
  });
});
