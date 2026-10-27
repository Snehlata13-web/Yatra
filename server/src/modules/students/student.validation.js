const studentFields = ['roll_number', 'admission_number', 'college_email', 'branch',
    'academic_year', 'room_number', 'block_number', 'batch'];

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateStudentUpdate = (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ success: false, message: 'Request body must be an object' });
    }
    const unknownFields = Object.keys(body).filter((field) => !studentFields.includes(field));
    if (unknownFields.length) {
        return res.status(400).json({
            success: false,
            message: `Unsupported field(s): ${unknownFields.join(', ')}`
        });
    }
    if (!Object.keys(body).length) {
        return res.status(400).json({ success: false, message: 'At least one field is required' });
    }
    if (body.roll_number !== undefined &&
        (typeof body.roll_number !== 'string' || !/^\d{13}$/.test(body.roll_number.trim()))) {
        return res.status(400).json({ success: false, message: 'Roll number must contain exactly 13 digits' });
    }
    if (body.admission_number !== undefined && !hasText(body.admission_number)) {
        return res.status(400).json({ success: false, message: 'Admission number cannot be empty' });
    }
    if (body.college_email !== undefined &&
        (typeof body.college_email !== 'string' || !emailPattern.test(body.college_email.trim().toLowerCase()))) {
        return res.status(400).json({ success: false, message: 'A valid college email is required' });
    }
    if (body.branch !== undefined && !hasText(body.branch)) {
        return res.status(400).json({ success: false, message: 'Branch cannot be empty' });
    }
    if (body.academic_year !== undefined &&
        (!Number.isInteger(body.academic_year) || body.academic_year < 1 || body.academic_year > 8)) {
        return res.status(400).json({ success: false, message: 'Academic year must be an integer from 1 to 8' });
    }

    req.body = Object.fromEntries(Object.entries(body).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value
    ]));
    if (req.body.college_email) req.body.college_email = req.body.college_email.toLowerCase();
    next();
};

const validateStudentId = (req, res, next) => {
    if (typeof req.params.id !== 'string' || req.params.id.trim() === '') {
        return res.status(400).json({ success: false, message: 'Student id is required' });
    }
    next();
};

module.exports = { validateStudentUpdate, validateStudentId };