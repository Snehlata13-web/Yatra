const test = require('node:test');
const assert = require('node:assert/strict');
const authValidation = require('../src/modules/auth/auth.validation');
const studentValidation = require('../src/modules/students/student.validation');
const wardenValidation = require('../src/modules/wardens/warden.validation');
const adminValidation = require('../src/modules/admins/admin.validation');

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
            role: 'STUDENT',
            roll_number: '1234567890123',
            admission_number: ' ADM-2026 ',
            college_email: ' ASHA@COLLEGE.EDU ',
            branch: ' CSE ',
            academic_year: 4,
            room_number: ' 101 ',
            block_no: ' A ',
            batch: ' 2026 ',
            course: ' B.Tech '
        }
    };
    authValidation.validateRegister(request, { status: () => ({ json: () => {} }) }, () => {});
    assert.deepEqual(request.body, {
        name: 'Asha Sharma',
        email: 'asha@example.com',
        password: 'Strong123',
        role: 'student',
        phone: null,
        roll_number: '1234567890123',
        admission_number: 'ADM-2026',
        college_email: 'asha@college.edu',
        branch: 'CSE',
        academic_year: 4,
        room_number: '101',
        block_no: 'A',
        batch: '2026',
        course: 'B.Tech'
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

test('requires complete student profile data at student registration', () => {
    const studentRegistration = {
        name: 'Asha',
        email: 'asha@example.com',
        password: 'Strong123',
        role: 'student',
        roll_number: '1234567890123',
        admission_number: 'ADM-2026',
        college_email: 'asha@college.edu',
        branch: 'CSE',
        academic_year: 4,
        room_number: '101',
        block_no: 'A',
        batch: '2026',
        course: 'B.Tech'
    };

    const { course, ...missingCourse } = studentRegistration;
    assert.equal(execute(authValidation.validateRegister, missingCourse), 400);
    assert.equal(execute(authValidation.validateRegister, {
        ...studentRegistration,
        roll_number: '123456789012A'
    }), 400);
    assert.equal(execute(authValidation.validateRegister, {
        ...studentRegistration,
        academic_year: '4'
    }), 400);
    assert.equal(execute(authValidation.validateRegister, {
        ...studentRegistration,
        college_email: 'invalid'
    }), 400);
});

test('rejects student-only profile fields for non-student registrations', () => {
    assert.equal(execute(authValidation.validateRegister, {
        name: 'Asha',
        email: 'asha@example.com',
        password: 'Strong123',
        role: 'warden',
        roll_number: '1234567890123'
    }), 400);
});

test('accepts and normalizes required warden registration details', () => {
    const request = {
        body: {
            name: '  Warden One ',
            email: ' WARDEN@example.com ',
            password: 'Strong123',
            role: 'WARDEN',
            employee_id: ' EMP-123 ',
            phone_number: ' +61412345678 ',
            hostel_block: ' North Block '
        }
    };

    authValidation.validateRegister(request, { status: () => ({ json: () => {} }) }, () => {});

    assert.deepEqual(request.body, {
        name: 'Warden One',
        email: 'warden@example.com',
        password: 'Strong123',
        role: 'warden',
        phone: null,
        employee_id: 'EMP-123',
        phone_number: '+61412345678',
        hostel_block: 'North Block'
    });
});

test('rejects incomplete or invalid warden registration details', () => {
    const wardenRegistration = {
        name: 'Warden One',
        email: 'warden@example.com',
        password: 'Strong123',
        role: 'warden',
        employee_id: 'EMP-123',
        phone_number: '+61412345678',
        hostel_block: 'North Block'
    };

    const { employee_id, ...missingEmployeeId } = wardenRegistration;
    assert.equal(execute(authValidation.validateRegister, missingEmployeeId), 400);
    assert.equal(execute(authValidation.validateRegister, {
        ...wardenRegistration,
        phone_number: 'not-a-phone'
    }), 400);
    assert.equal(execute(authValidation.validateRegister, {
        ...wardenRegistration,
        hostel_block: '   '
    }), 400);
});

test('accepts and normalizes required guard registration details', () => {
    const request = {
        body: {
            name: '  Guard One ',
            email: ' GUARD@example.com ',
            password: 'Strong123',
            role: 'GUARD',
            employee_id: ' EMP-456 ',
            gate_number: ' Main Gate '
        }
    };

    authValidation.validateRegister(request, { status: () => ({ json: () => {} }) }, () => {});

    assert.deepEqual(request.body, {
        name: 'Guard One',
        email: 'guard@example.com',
        password: 'Strong123',
        role: 'guard',
        phone: null,
        employee_id: 'EMP-456',
        gate_number: 'Main Gate'
    });
});

test('rejects incomplete or invalid guard registration details', () => {
    const guardRegistration = {
        name: 'Guard One',
        email: 'guard@example.com',
        password: 'Strong123',
        role: 'guard',
        employee_id: 'EMP-456',
        gate_number: 'Main Gate'
    };

    const { gate_number, ...missingGate } = guardRegistration;
    assert.equal(execute(authValidation.validateRegister, missingGate), 400);
    assert.equal(execute(authValidation.validateRegister, {
        ...guardRegistration,
        employee_id: '   '
    }), 400);
    assert.equal(execute(authValidation.validateRegister, {
        ...guardRegistration,
        hostel_block: 'North Block'
    }), 400);
});

test('validates warden decisions for pending student registrations', () => {
    assert.equal(execute(wardenValidation.validateUserId, {}, { userId: 'user-123' }), 'next');
    assert.equal(execute(wardenValidation.validateUserId, {}, { userId: ' ' }), 400);
    assert.equal(execute(adminValidation.validateApprovalStatus, {
        approval_status: 'approved'
    }), 'next');
    assert.equal(execute(adminValidation.validateApprovalStatus, {
        approval_status: 'rejected'
    }), 'next');
    assert.equal(execute(adminValidation.validateApprovalStatus, {
        approval_status: 'pending'
    }), 400);
    assert.equal(execute(adminValidation.validateApprovalStatus, {
        approval_status: 'approved',
        role: 'admin'
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
