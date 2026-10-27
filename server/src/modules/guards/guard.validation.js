const validateId = (req, res, next) => {
    if (typeof req.params.id !== 'string' || req.params.id.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Pass id is required'
        });
    }
    next();
};

const validatePassUpdate = (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({
            success: false,
            message: 'Request body must be an object'
        });
    }

    const allowedFields = ['status', 'remarks'];
    const unknownFields = Object.keys(body).filter((field) => !allowedFields.includes(field));
    if (unknownFields.length) {
        return res.status(400).json({
            success: false,
            message: `Unsupported field(s): ${unknownFields.join(', ')}`
        });
    }
    if (!Object.keys(body).length) {
        return res.status(400).json({
            success: false,
            message: 'At least one field is required'
        });
    }
    if (body.status !== undefined &&
        (typeof body.status !== 'string' ||
            !['pending', 'approved', 'rejected'].includes(body.status))) {
        return res.status(400).json({
            success: false,
            message: 'Status must be pending, approved, or rejected'
        });
    }
    if (body.remarks !== undefined &&
        (typeof body.remarks !== 'string' || body.remarks.trim().length > 1000)) {
        return res.status(400).json({
            success: false,
            message: 'Remarks must be a string of at most 1000 characters'
        });
    }
    req.body = {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.remarks !== undefined ? { remarks: body.remarks.trim() } : {})
    };
    next();
};

const validateGateAction = (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).length !== 1 || !['OUT', 'IN'].includes(body.action)) {
        return res.status(400).json({
            success: false,
            message: 'Action must be OUT or IN'
        });
    }
    next();
};

module.exports = {
    validateId,
    validatePassUpdate,
    validateGateAction
};