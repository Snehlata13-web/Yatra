const test = require('node:test');
const assert = require('node:assert/strict');
const validation = require('../src/modules/helpdesk/helpdesk.validation.js');

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

test('accepts a valid help request', () => {
    assert.equal(execute(validation.validateHelpRequest, {
        title: 'Need help with notes',
        description: 'Can someone share the notes for today?'
    }), 'next');
});

test('rejects invalid help request data', () => {
    assert.equal(execute(validation.validateHelpRequest, {
        title: ' ',
        description: 'Details'
    }), 400);
    assert.equal(execute(validation.validateHelpRequest, {
        title: 'Help',
        description: 'Details',
        student_id: 'another-student'
    }), 400);
    assert.equal(execute(validation.validateHelpRequestId, {}, { id: '' }), 400);
});
