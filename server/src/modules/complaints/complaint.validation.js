const categories = ['Carpenter', 'Electricity', 'Plumber', 'Other'];
const statuses = ['Pending', 'In Progress', 'Awaiting Confirmation', 'Resolved', 'Reopened'];
const validateId = (req, res, next) => {
    if (typeof req.params.id !== 'string' || req.params.id.trim() === '') {
        return res.status(400).json({ success: false, message: 'Complaint id is required' });
    }
    next();
};

const validateCreate = (req, res, next) => {
    const body = req.body;
    const allowed = ['category', 'problem_title', 'problem_description'];
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ success: false, message: 'Request body must be an object' });
    }
    const unknown = Object.keys(body).filter((field) => !allowed.includes(field));
    if (unknown.length) {
        return res.status(400).json({ success: false, message: `Unsupported field(s): ${unknown.join(', ')}` });
    }
    if (!categories.includes(body.category) ||
        typeof body.problem_title !== 'string' || body.problem_title.trim().length < 1 ||
        body.problem_title.trim().length > 200 ||
        typeof body.problem_description !== 'string' || body.problem_description.trim().length < 1 ||
        body.problem_description.trim().length > 5000) {
        return res.status(400).json({
            success: false,
            message: 'Category, problem title, and problem description are required and valid'
        });
    }
    req.body = {
        category: body.category,
        problem_title: body.problem_title.trim(),
        problem_description: body.problem_description.trim()
    };
    next();
};

const validateWardenFilter = (req, res, next) => {
    const { category, status, room_number } = req.query;
    if (category !== undefined && !categories.includes(category)) {
        return res.status(400).json({ success: false, message: 'Invalid complaint category' });
    }
    if (status !== undefined && !statuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid complaint status' });
    }
    if (room_number !== undefined &&
        (typeof room_number !== 'string' || room_number.trim() === '' || room_number.length > 50)) {
        return res.status(400).json({ success: false, message: 'Invalid room number' });
    }
    next();
};

const validateStatus = (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some((field) => field !== 'status') ||
        !statuses.includes(body.status)) {
        return res.status(400).json({ success: false, message: 'A valid status is required' });
    }
    next();
};

module.exports = {
    categories,
    statuses,
    validateId,
    validateCreate,
    validateWardenFilter,
    validateStatus
};