const test = require('node:test');
const assert = require('node:assert/strict');
const validation = require('../src/modules/complaints/complaint.validation');
const service = require('../src/modules/complaints/complaint.service');

const execute = (middleware, body, query = {}, params = {}) => {
    let result = 'next';
    const response = {
        status(code) {
            return { json() { result = code; } };
        }
    };
    middleware({ body, query, params }, response, () => {});
    return result;
};

test('validates complaint creation', () => {
    assert.equal(execute(validation.validateCreate, {
        category: 'Plumber',
        problem_title: 'Leaking tap',
        problem_description: 'The tap is leaking continuously'
    }), 'next');
});

test('rejects invalid complaint input and filters', () => {
    assert.equal(execute(validation.validateCreate, {
        category: 'Unknown',
        problem_title: 'Issue',
        problem_description: 'Details'
    }), 400);
    assert.equal(execute(validation.validateWardenFilter, {}, { status: 'Resolved' }), 'next');
    assert.equal(execute(validation.validateWardenFilter, {}, { status: 'Done' }), 400);
});

test('enforces complaint status lifecycle', () => {
    assert.deepEqual(service.transitions.Pending, ['In Progress']);
    assert.deepEqual(service.transitions['Awaiting Confirmation'], ['Resolved', 'Reopened']);
    assert.deepEqual(service.transitions.Reopened, ['In Progress']);
    assert.deepEqual(service.transitions.Resolved, []);
});
