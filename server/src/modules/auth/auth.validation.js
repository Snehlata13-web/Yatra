const allowedRegisterFields = ['name', 'email', 'password', 'phone', 'role'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[1-9]\d{7,14}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

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

    const unknownFields = invalidFields(body, allowedRegisterFields);
    if (unknownFields.length) {
        return res.status(400).json({
            success: false,
            message: `Unsupported field(s): ${unknownFields.join(', ')}`
        });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : body.name;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email;
    const password = body.password;
    const role = typeof body.role === 'string' ? body.role.trim().toLowerCase() : body.role;
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

    req.body = { name, email, password, role, phone };
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