const test = require('node:test');
const assert = require('node:assert/strict');
const validation = require('../src/modules/approvals/approval.validation.js');

const execute = (middleware, body = {}, params = {}, query = {}) => {
    let result = 'next';
    const response = {
        status(code) {
            return { json() { result = code; } };
        }
    };
    middleware({ body, params, query }, response, () => {});
    return result;
};

test('validates approval pass IDs and decisions', () => {
    assert.equal(execute(validation.validatePassId, {}, { passId: 'pass-1' }), 'next');
    assert.equal(execute(validation.validateDecision, { decision: 'approved' }), 'next');
    assert.equal(execute(validation.validateDecision, { decision: 'rejected' }), 'next');
});

test('rejects invalid approval input and filters', () => {
    assert.equal(execute(validation.validatePassId, {}, { passId: '' }), 400);
    assert.equal(execute(validation.validateDecision, { decision: 'pending' }), 400);
    assert.equal(execute(validation.validateDecision, { status: 'approved' }), 400);
    assert.equal(execute(validation.validateApprovalQuery, {}, {}, { decision: 'complete' }), 400);
    assert.equal(execute(validation.validateApprovalQuery, {}, {}, { decision: 'approved' }), 'next');
});
