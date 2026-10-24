/**
 * Unit Tests: Room membership authorization (IDOR + private-room guards)
 *
 * These tests monkey-patch roomsService (a cached module object) and exercise
 * the controller directly, so no database connection is required.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const roomsService = require('../src/modules/rooms/rooms.service');
const roomsController = require('../src/modules/rooms/rooms.controller');

function makeRes() {
  const res = { statusCode: null, body: null, _status: null };
  res.status = (code) => { res._status = code; return res; };
  res.json = (obj) => { res.body = obj; res.statusCode = res._status; return res; };
  return res;
}

test('Rooms Authorization Tests', async (t) => {
  await t.test('non-admin cannot add another user to a room (IDOR)', async () => {
    let joinCalledWith = null;
    roomsService.joinRoom = async (roomId, userId) => { joinCalledWith = userId; return { joined: true }; };
    roomsService.getRoomById = async () => ({ id: 1, is_private: false });
    roomsService.isUserInRoom = async () => false;

    const req = { params: { id: '1' }, user: { id: 2, role: 'member' }, body: { userId: 5 } };
    const res = makeRes();
    await roomsController.joinRoom(req, res, () => {});

    assert.equal(res.statusCode, 403, 'should return 403 for non-admin acting on another user');
    assert.equal(joinCalledWith, null, 'joinRoom service must not be called');
  });

  await t.test('admin can add another user to a room', async () => {
    let joinCalledWith = null;
    roomsService.joinRoom = async (roomId, userId) => { joinCalledWith = userId; return { joined: true }; };
    roomsService.getRoomById = async () => ({ id: 1, is_private: false });
    roomsService.isUserInRoom = async () => false;

    const req = { params: { id: '1' }, user: { id: 2, role: 'admin' }, body: { userId: 5 } };
    const res = makeRes();
    await roomsController.joinRoom(req, res, () => {});

    assert.equal(res.statusCode, 200, 'admin should be allowed to add a member');
    assert.equal(joinCalledWith, 5, 'should join with the requested user id');
  });

  await t.test('non-admin cannot self-join a private room they are not a member of', async () => {
    let joinCalled = false;
    roomsService.joinRoom = async () => { joinCalled = true; return { joined: true }; };
    roomsService.getRoomById = async () => ({ id: 3, is_private: true });
    roomsService.isUserInRoom = async () => false;

    const req = { params: { id: '3' }, user: { id: 2, role: 'member' }, body: {} };
    const res = makeRes();
    await roomsController.joinRoom(req, res, () => {});

    assert.equal(res.statusCode, 403, 'should reject non-member joining a private room');
    assert.equal(joinCalled, false, 'joinRoom service must not be called');
  });

  await t.test('existing member can re-join a private room (no-op)', async () => {
    let joinCalledWith = null;
    roomsService.joinRoom = async (roomId, userId) => { joinCalledWith = userId; return { joined: true }; };
    roomsService.getRoomById = async () => ({ id: 3, is_private: true });
    roomsService.isUserInRoom = async () => true;

    const req = { params: { id: '3' }, user: { id: 2, role: 'member' }, body: {} };
    const res = makeRes();
    await roomsController.joinRoom(req, res, () => {});

    assert.equal(res.statusCode, 200, 'existing member should be allowed');
    assert.equal(joinCalledWith, 2, 'should join as themselves');
  });

  await t.test('non-admin cannot remove another user from a room (IDOR)', async () => {
    let leaveCalledWith = null;
    roomsService.leaveRoom = async (roomId, userId) => { leaveCalledWith = userId; return { left: true }; };

    const req = { params: { id: '1' }, user: { id: 2, role: 'member' }, body: { userId: 5 } };
    const res = makeRes();
    await roomsController.leaveRoom(req, res, () => {});

    assert.equal(res.statusCode, 403, 'should return 403 for non-admin removing another user');
    assert.equal(leaveCalledWith, null, 'leaveRoom service must not be called');
  });

  await t.test('deleteRoom returns 400 for invalid id', async () => {
    const req = { params: { id: 'abc' }, user: { id: 1, role: 'admin' } };
    const res = makeRes();
    await roomsController.deleteRoom(req, res, () => {});
    assert.equal(res.statusCode, 400, 'should reject non-numeric room id');
  });

  await t.test('deleteRoom deletes room via service', async () => {
    let deletedId = null;
    roomsService.deleteRoomById = async (id) => { deletedId = id; return { success: true, deleted: { id, name: 'Old Room' } }; };

    const req = { params: { id: '9' }, user: { id: 1, role: 'admin' } };
    const res = makeRes();
    await roomsController.deleteRoom(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.equal(deletedId, 9, 'should call deleteRoomById with parsed id');
  });
});
