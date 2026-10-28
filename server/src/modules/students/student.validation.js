const studentFields = ['roll_number', 'admission_number', 'college_email', 'branch',
    'academic_year', 'room_number', 'block_no', 'batch', 'course'];
const requiredRegistrationFields = studentFields;
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateStudentData = (body, { requireAll = false } = {}) => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return 'Request body must be an object';
    }
    const unknownFields = Object.keys(body).filter((field) => !studentFields.includes(field));
    if (unknownFields.length) {
        return `Unsupported field(s): ${unknownFields.join(', ')}`;
    }
    if (!Object.keys(body).length) {
        return 'At least one field is required';
    }
    if (requireAll && requiredRegistrationFields.some((field) => body[field] === undefined || body[field] === null)) {
        const missing = requiredRegistrationFields.filter((field) => body[field] === undefined || body[field] === null);
        return `Required student field(s): ${missing.join(', ')}`;
    }
    if (body.roll_number !== undefined &&
        (typeof body.roll_number !== 'string' || !/^\d{13}$/.test(body.roll_number.trim()))) {
        return 'Roll number must contain exactly 13 digits';
    }
    if (body.admission_number !== undefined && !hasText(body.admission_number)) {
        return 'Admission number cannot be empty';
    }
    if (body.college_email !== undefined &&
        (typeof body.college_email !== 'string' || !emailPattern.test(body.college_email.trim().toLowerCase()))) {
        return 'A valid college email is required';
    }
    for (const field of ['branch', 'room_number', 'block_no', 'batch', 'course']) {
        if (body[field] !== undefined && !hasText(body[field])) {
            return `${field} cannot be empty`;
        }
    }
    if (body.academic_year !== undefined &&
        (!Number.isInteger(body.academic_year) || body.academic_year < 1 || body.academic_year > 8)) {
        return 'Academic year must be an integer from 1 to 8';
    }

    return null;
};

const normalizeStudentData = (body) => {
    const normalized = Object.fromEntries(Object.entries(body).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value
    ]));
    if (normalized.college_email) normalized.college_email = normalized.college_email.toLowerCase();
    return normalized;
};

const validateStudentUpdate = (req, res, next) => {
    const message = validateStudentData(req.body);
    if (message) {
        return res.status(400).json({ success: false, message });
    }
    req.body = normalizeStudentData(req.body);
    next();
};

const validateStudentId = (req, res, next) => {
    if (typeof req.params.id !== 'string' || req.params.id.trim() === '') {
        return res.status(400).json({ success: false, message: 'Student id is required' });
    }
    next();
};

module.exports = {
    validateStudentUpdate,
    validateStudentId,
    validateStudentData,
    normalizeStudentData,
    studentFields,
    requiredRegistrationFields
};