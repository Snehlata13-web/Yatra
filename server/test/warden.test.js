const test = require('node:test');
const assert = require('node:assert/strict');
const validation = require('../src/modules/wardens/warden.validation.js');

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

test('validates warden pass IDs and approval decisions', () => {
    assert.equal(execute(validation.validatePassId, {}, { id: 'pass-1' }), 'next');
    assert.equal(execute(validation.validateApprovalDecision, {
        decision: 'approved'
    }), 'next');
    assert.equal(execute(validation.validateApprovalDecision, {
        decision: 'rejected'
    }), 'next');
});

test('rejects invalid warden approval requests', () => {
    assert.equal(execute(validation.validatePassId, {}, { id: '' }), 400);
    assert.equal(execute(validation.validateApprovalDecision, {
        decision: 'pending'
    }), 400);
    assert.equal(execute(validation.validateApprovalDecision, {
        decision: 'approved',
        status: 'approved'
    }), 400);
});

test('reuses pass field validation for warden updates', () => {
    assert.equal(execute(validation.validatePassUpdate, {
        reason: 'Updated reason'
    }), 'next');
    assert.equal(execute(validation.validatePassUpdate, {
        status: 'approved'
    }), 400);
    assert.equal(execute(validation.validatePassUpdate, {}), 400);
});
