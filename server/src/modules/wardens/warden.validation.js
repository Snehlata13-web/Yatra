const passValidation = require('../passes/pass.validation.js');

const validatePassId = (req, res, next) => {
    if (typeof req.params.id !== 'string' || req.params.id.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Pass id is required'
        });
    }
    next();
};

const validateApprovalDecision = (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some((field) => field !== 'decision') ||
        !['approved', 'rejected'].includes(body.decision)) {
        return res.status(400).json({
            success: false,
            message: 'Decision must be approved or rejected'
        });
    }
    req.body = { decision: body.decision };
    next();
};

const validatePassUpdate = (req, res, next) => {
    passValidation.updatePassSchema(req, res, next);
};

module.exports = {
    validatePassId,
    validateApprovalDecision,
    validatePassUpdate
};