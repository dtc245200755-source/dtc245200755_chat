/**
 * Unit Tests: Admin authorization middleware & role-based data access
 *
 * These tests exercise the requireAdmin middleware and the users controller
 * (with usersService monkey-patched) so no database connection is required.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { requireAdmin } = require('../src/middleware/auth');
const usersService = require('../src/modules/users/users.service');
const usersController = require('../src/modules/users/users.controller');

function makeRes() {
  const res = { statusCode: null, body: null, _status: null };
  res.status = (code) => { res._status = code; return res; };
  res.json = (obj) => { res.body = obj; res.statusCode = res._status; return res; };
  return res;
}

test('Admin Authorization Tests', async (t) => {
  await t.test('requireAdmin blocks non-admin with 403', () => {
    let nextCalled = false;
    const req = { user: { id: 2, role: 'member' } };
    const res = makeRes();

    requireAdmin(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 403, 'should return 403 for non-admin');
    assert.equal(nextCalled, false, 'next must not be called');
  });

  await t.test('requireAdmin blocks missing user with 403', () => {
    let nextCalled = false;
    const req = {};
    const res = makeRes();

    requireAdmin(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 403, 'should return 403 when req.user is missing');
    assert.equal(nextCalled, false, 'next must not be called');
  });

  await t.test('requireAdmin allows admin through', () => {
    let nextCalled = false;
    const req = { user: { id: 1, role: 'admin' } };
    const res = makeRes();

    requireAdmin(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true, 'next should be called for admin');
  });

  await t.test('listUsers strips email for non-admin', async () => {
    usersService.getAllUsers = async () => [
      { id: 1, username: 'alice', email: 'alice@internal.local', display_name: 'Alice', role: 'member' },
      { id: 2, username: 'bob', email: 'bob@internal.local', display_name: 'Bob', role: 'admin' },
    ];

    const req = { user: { id: 1, role: 'member' } };
    const res = makeRes();
    await usersController.listUsers(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.users[0].email, undefined, 'email must be stripped for non-admin');
    assert.equal(res.body.data.users[0].username, 'alice');
  });

  await t.test('listUsers keeps email for admin', async () => {
    usersService.getAllUsers = async () => [
      { id: 1, username: 'alice', email: 'alice@internal.local', display_name: 'Alice', role: 'member' },
    ];

    const req = { user: { role: 'admin' } };
    const res = makeRes();
    await usersController.listUsers(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.users[0].email, 'alice@internal.local', 'admin should see emails');
  });

  await t.test('deleteUser blocks self-delete with 403', async () => {
    const req = { user: { id: 7, role: 'admin' }, params: { id: '7' } };
    const res = makeRes();
    await usersController.deleteUser(req, res, () => {});
    assert.equal(res.statusCode, 403, 'admin cannot delete their own account');
  });

  await t.test('deleteUser deletes another user for admin', async () => {
    usersService.deleteUserById = async (id) => ({ success: true, deleted: { id, username: 'demo_user' } });

    const req = { user: { id: 1, role: 'admin' }, params: { id: '2' } };
    const res = makeRes();
    await usersController.deleteUser(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.deleted.username, 'demo_user');
  });
});
