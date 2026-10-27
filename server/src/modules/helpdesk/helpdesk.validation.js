const badRequest = (res, message) => res.status(400).json({
    success: false,
    message
});

const validateHelpRequest = (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return badRequest(res, 'Request body must be an object');
    }

    const allowedFields = ['title', 'description'];
    const unknownFields = Object.keys(body).filter((field) => !allowedFields.includes(field));
    if (unknownFields.length) {
        return badRequest(res, `Unsupported field(s): ${unknownFields.join(', ')}`);
    }
    if (typeof body.title !== 'string' ||
        body.title.trim().length < 1 ||
        body.title.trim().length > 200) {
        return badRequest(res, 'Title must be between 1 and 200 characters');
    }
    if (typeof body.description !== 'string' ||
        body.description.trim().length < 1 ||
        body.description.trim().length > 5000) {
        return badRequest(res, 'Description must be between 1 and 5000 characters');
    }

    req.body = {
        title: body.title.trim(),
        description: body.description.trim()
    };
    next();
};

const validateHelpRequestId = (req, res, next) => {
    if (typeof req.params.id !== 'string' || req.params.id.trim() === '') {
        return badRequest(res, 'Help request id is required');
    }
    next();
};

module.exports = {
    validateHelpRequest,
    validateHelpRequestId
};