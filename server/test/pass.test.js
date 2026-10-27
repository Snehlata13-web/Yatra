const test = require('node:test');
const assert = require('node:assert/strict');
const validation = require('../src/modules/passes/pass.validation');

const execute = (middleware, body = {}, params = {}) => {
    let result = 'next';
    const response = {
        status(code) {
            return { json() { result = code; } };
        }
    };
    middleware({ body, params }, response, () => {});
    return result;
};

test('accepts a valid pass creation request', () => {
    assert.equal(execute(validation.createPassSchema, {
        reason: 'Personal work',
        destination: 'Home',
        departure_time: '2026-10-27T09:00:00Z',
        return_time: '2026-10-27T18:00:00Z'
    }), 'next');
});

test('rejects invalid pass fields and dates', () => {
    assert.equal(execute(validation.createPassSchema, {
        reason: ' ',
        departure_time: 'not-a-date'
    }), 400);
    assert.equal(execute(validation.updatePassSchema, {
        status: 'approved'
    }), 400);
    assert.equal(execute(validation.updatePassSchema, {
        reason: 'Travel',
        departure_time: '2026-10-28',
        return_time: '2026-10-27'
    }), 400);
});

test('rejects invalid IDs and approval request bodies', () => {
    assert.equal(execute(validation.passIdSchema, {}, { id: '' }), 400);
    assert.equal(execute(validation.approvePassSchema, { decision: 'approved' }), 'next');
    assert.equal(execute(validation.approvePassSchema, { decision: 'rejected' }), 'next');
    assert.equal(execute(validation.approvePassSchema, { decision: 'invalid' }), 400);
    assert.equal(execute(validation.approvePassSchema, { status: 'approved' }), 400);
    assert.equal(execute(validation.approvePassSchema, {}), 'next');
});
