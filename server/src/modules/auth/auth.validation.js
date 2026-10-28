const allowedRegisterFields = ['name', 'email', 'password', 'phone', 'role'];
const studentValidation = require('../students/student.validation.js');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[1-9]\d{7,14}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;
const wardenFields = ['employee_id', 'phone_number', 'hostel_block'];
const guardFields = ['employee_id', 'gate_number'];

const invalidFields = (body, allowedFields) =>
    Object.keys(body).filter((field) => !allowedFields.includes(field));

const validateName = (name) =>
    typeof name === 'string' &&
    name.trim().length >= 2 &&
    name.trim().length <= 100 &&
    /\S/.test(name);

const validateRegister = (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ success: false, message: 'Request body must be an object' });
    }

    const role = typeof body.role === 'string' ? body.role.trim().toLowerCase() : body.role;
    const roleFields = role === 'student'
        ? studentValidation.studentFields
        : role === 'warden' ? wardenFields
            : role === 'guard' ? guardFields : [];
    const registerFields = [...allowedRegisterFields, ...roleFields];
    const unknownFields = invalidFields(body, registerFields);
    if (unknownFields.length) {
        return res.status(400).json({
            success: false,
            message: `Unsupported field(s): ${unknownFields.join(', ')}`
        });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : body.name;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email;
    const password = body.password;
    const phone = body.phone === undefined || body.phone === null
        ? null
        : typeof body.phone === 'string' ? body.phone.trim() : body.phone;

    if (!validateName(name)) {
        return res.status(400).json({ success: false, message: 'Name must be 2 to 100 characters' });
    }
    if (typeof email !== 'string' || !emailPattern.test(email)) {
        return res.status(400).json({ success: false, message: 'A valid email is required' });
    }
    if (typeof password !== 'string' || !passwordPattern.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be 8 to 128 characters and include uppercase, lowercase, and a number'
        });
    }
    if (!['student', 'warden', 'guard'].includes(role)) {
        return res.status(400).json({ success: false, message: 'A valid non-admin role is required' });
    }
    if (phone !== null && (typeof phone !== 'string' || !phonePattern.test(phone))) {
        return res.status(400).json({ success: false, message: 'Phone number format is invalid' });
    }

    const studentData = role === 'student'
        ? Object.fromEntries(studentValidation.studentFields
            .filter((field) => Object.hasOwn(body, field))
            .map((field) => [field, body[field]]))
        : null;
    if (studentData) {
        const studentError = studentValidation.validateStudentData(studentData, { requireAll: true });
        if (studentError) {
            return res.status(400).json({ success: false, message: studentError });
        }
    }

    let wardenData = null;
    if (role === 'warden') {
        wardenData = Object.fromEntries(wardenFields.map((field) => [field, body[field]]));
        const missingFields = wardenFields.filter((field) =>
            wardenData[field] === undefined || wardenData[field] === null);
        if (missingFields.length) {
            return res.status(400).json({
                success: false,
                message: `Required warden field(s): ${missingFields.join(', ')}`
            });
        }
        for (const field of ['employee_id', 'hostel_block']) {
            if (typeof wardenData[field] !== 'string' ||
                wardenData[field].trim().length === 0 ||
                wardenData[field].trim().length > 100) {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be a non-empty string of at most 100 characters`
                });
            }
        }
        if (typeof wardenData.phone_number !== 'string' ||
            !phonePattern.test(wardenData.phone_number.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Warden phone_number format is invalid'
            });
        }
        wardenData = Object.fromEntries(Object.entries(wardenData).map(([field, value]) => [
            field,
            value.trim()
        ]));
    }

    let guardData = null;
    if (role === 'guard') {
        guardData = Object.fromEntries(guardFields.map((field) => [field, body[field]]));
        const missingFields = guardFields.filter((field) =>
            guardData[field] === undefined || guardData[field] === null);
        if (missingFields.length) {
            return res.status(400).json({
                success: false,
                message: `Required guard field(s): ${missingFields.join(', ')}`
            });
        }
        for (const field of guardFields) {
            if (typeof guardData[field] !== 'string' ||
                guardData[field].trim().length === 0 ||
                guardData[field].trim().length > 100) {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be a non-empty string of at most 100 characters`
                });
            }
        }
        guardData = Object.fromEntries(Object.entries(guardData).map(([field, value]) => [
            field,
            value.trim()
        ]));
    }

    req.body = {
        name,
        email,
        password,
        role,
        phone,
        ...(studentData ? studentValidation.normalizeStudentData(studentData) : {}),
        ...(wardenData || {}),
        ...(guardData || {})
    };
    next();
};

const validateLogin = (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ success: false, message: 'Request body must be an object' });
    }
    const unknownFields = invalidFields(body, ['email', 'password']);
    if (unknownFields.length) {
        return res.status(400).json({
            success: false,
            message: `Unsupported field(s): ${unknownFields.join(', ')}`
        });
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email;
    if (typeof email !== 'string' || !emailPattern.test(email) ||
        typeof body.password !== 'string' || body.password.trim() === '') {
        return res.status(400).json({ success: false, message: 'Valid email and password are required' });
    }
    req.body = { email, password: body.password };
    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateName,
    emailPattern,
    phonePattern
};