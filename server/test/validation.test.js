const test = require('node:test');
const assert = require('node:assert/strict');
const authValidation = require('../src/modules/auth/auth.validation');
const studentValidation = require('../src/modules/students/student.validation');

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

test('accepts and normalizes a valid registration', () => {
    const request = {
        body: {
            name: '  Asha Sharma ',
            email: ' ASHA@example.com ',
            password: 'Strong123',
            role: 'STUDENT'
        }
    };
    authValidation.validateRegister(request, { status: () => ({ json: () => {} }) }, () => {});
    assert.deepEqual(request.body, {
        name: 'Asha Sharma',
        email: 'asha@example.com',
        password: 'Strong123',
        role: 'student',
        phone: null
    });
});

test('rejects invalid registration fields and unexpected fields', () => {
    assert.equal(execute(authValidation.validateRegister, {
        name: '   ', email: 'invalid', password: 'weak', role: 'admin'
    }), 400);
    assert.equal(execute(authValidation.validateRegister, {
        name: 'Asha', email: 'a@b.com', password: 'Strong123', role: 'student', is_admin: true
    }), 400);
});

test('validates roll number and academic year types', () => {
    assert.equal(execute(studentValidation.validateStudentUpdate, {
        roll_number: '1234567890123', academic_year: 4
    }), 'next');
    assert.equal(execute(studentValidation.validateStudentUpdate, {
        roll_number: '123456789012', academic_year: 4
    }), 400);
    assert.equal(execute(studentValidation.validateStudentUpdate, {
        roll_number: '123456789012a', academic_year: 4
    }), 400);
    assert.equal(execute(studentValidation.validateStudentUpdate, {
        roll_number: '1234567890123', academic_year: '4'
    }), 400);
});
