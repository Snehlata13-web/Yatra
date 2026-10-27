const test = require('node:test');
const assert = require('node:assert/strict');
const validation = require('../src/modules/guards/guard.validation');

const execute = (middleware, body, params = {}) => {
    let result = 'next';
    const response = {
        status(code) {
            return { json() { result = code; } };
        }
    };
    middleware({ body, params }, response, () => {});
    return result;
};

test('validates guard pass ids and updates', () => {
    assert.equal(execute(validation.validateId, {}, { id: 'pass-id' }), 'next');
    assert.equal(execute(validation.validatePassUpdate, {
        status: 'approved',
        remarks: 'Verified at gate'
    }), 'next');
});

test('rejects invalid guard pass updates', () => {
    assert.equal(execute(validation.validateId, {}, { id: '' }), 400);
    assert.equal(execute(validation.validatePassUpdate, { status: 'invalid' }), 400);
    assert.equal(execute(validation.validatePassUpdate, { role: 'admin' }), 400);
    assert.equal(execute(validation.validatePassUpdate, {}), 400);
});

test('validates guard gate actions', () => {
    assert.equal(execute(validation.validateGateAction, { action: 'OUT' }), 'next');
    assert.equal(execute(validation.validateGateAction, { action: 'IN' }), 'next');
    assert.equal(execute(validation.validateGateAction, { action: 'EXIT' }), 400);
    assert.equal(execute(validation.validateGateAction, { action: 'OUT', pass_id: 3 }), 400);
});
