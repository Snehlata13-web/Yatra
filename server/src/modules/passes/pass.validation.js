const passFields = [
    'reason',
    'destination',
    'departure_time',
    'return_time'
];
const protectedFields = ['id', 'user_id', 'student_id', 'status', 'approval_status', 'decision'];
const isoDate = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

const error = (res, message) => res.status(400).json({ success: false, message });

const validateId = (req, res, next) => {
    if (typeof req.params.id !== 'string' || req.params.id.trim() === '') {
        return error(res, 'Pass id is required');
    }
    next();
};

const validatePassFields = (body, { requireFields = false } = {}) => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return 'Request body must be an object';
    }
    const unknown = Object.keys(body).filter((field) => !passFields.includes(field));
    if (unknown.length) return `Unsupported field(s): ${unknown.join(', ')}`;
    if (Object.keys(body).some((field) => protectedFields.includes(field))) {
        return 'Protected pass fields cannot be changed';
    }
    if (!Object.keys(body).length) return 'At least one field is required';

    for (const field of ['reason', 'destination']) {
        if (body[field] !== undefined &&
            (typeof body[field] !== 'string' || body[field].trim() === '' ||
                body[field].trim().length > 1000)) {
            return `${field} must be a non-empty string of at most 1000 characters`;
        }
    }
    for (const field of ['departure_time', 'return_time']) {
        if (body[field] !== undefined &&
            (typeof body[field] !== 'string' || !isoDate.test(body[field]) ||
                Number.isNaN(Date.parse(body[field])))) {
            return `${field} must be a valid date`;
        }
    }
    if (body.departure_time && body.return_time &&
        new Date(body.return_time) < new Date(body.departure_time)) {
        return 'return_time cannot be earlier than departure_time';
    }
    if (requireFields && (!body.reason || !body.departure_time)) {
        return 'reason and departure_time are required';
    }
    return null;
};

const normalize = (req) => {
    req.body = Object.fromEntries(Object.entries(req.body).map(([field, value]) => [
        field,
        typeof value === 'string' ? value.trim() : value
    ]));
};

const createPassSchema = (req, res, next) => {
    const message = validatePassFields(req.body, { requireFields: true });
    if (message) return error(res, message);
    normalize(req);
    next();
};

const updatePassSchema = (req, res, next) => {
    const message = validatePassFields(req.body);
    if (message) return error(res, message);
    normalize(req);
    next();
};

const approvePassSchema = (req, res, next) => {
    const body = req.body || {};
    const fields = Object.keys(body);
    if (fields.some((field) => field !== 'decision') ||
        (body.decision !== undefined && !['approved', 'rejected'].includes(body.decision))) {
        return error(res, 'Decision must be approved or rejected');
    }
    req.body = { decision: body.decision || 'approved' };
    next();
};

module.exports = {
    createPassSchema,
    updatePassSchema,
    passIdSchema: validateId,
    approvePassSchema
};