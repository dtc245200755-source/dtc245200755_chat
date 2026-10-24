/**
 * Unit Tests: Input Validation Helpers
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRegister, validateMessage } = require('../src/middleware/validate');

test('Validation Middleware Tests', async (t) => {
  await t.test('validateRegister rejects short usernames', () => {
    const req = { body: { username: 'ab', password: 'password123' } };
    let status = null;
    let jsonResp = null;
    const res = {
      status: (code) => {
        status = code;
        return { json: (obj) => { jsonResp = obj; } };
      },
    };
    const next = () => {};

    validateRegister(req, res, next);
    assert.equal(status, 400);
    assert.equal(jsonResp.success, false);
  });

  await t.test('validateRegister accepts valid registration payload', () => {
    const req = { body: { username: 'valid_user', password: 'password123', email: 'test@example.com' } };
    let nextCalled = false;
    const res = {};
    const next = () => { nextCalled = true; };

    validateRegister(req, res, next);
    assert.equal(nextCalled, true);
    assert.equal(req.sanitized.username, 'valid_user');
  });

  await t.test('validateMessage rejects empty message', () => {
    const req = { body: { content: '   ' } };
    let status = null;
    let jsonResp = null;
    const res = {
      status: (code) => {
        status = code;
        return { json: (obj) => { jsonResp = obj; } };
      },
    };
    const next = () => {};

    validateMessage(req, res, next);
    assert.equal(status, 400);
    assert.equal(jsonResp.success, false);
  });
});
