const decisions = ['approved', 'rejected'];

const validatePassId = (req, res, next) => {
    if (typeof req.params.passId !== 'string' || req.params.passId.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Pass id is required'
        });
    }
    next();
};

const validateDecision = (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some((field) => field !== 'decision') ||
        !decisions.includes(body.decision)) {
        return res.status(400).json({
            success: false,
            message: 'Decision must be approved or rejected'
        });
    }
    req.body = { decision: body.decision };
    next();
};

const validateApprovalStatus = (req, res, next) => {
    if (!['pending', 'approved', 'rejected'].includes(req.params.status)) {
        return res.status(400).json({
            success: false,
            message: 'Status must be pending, approved, or rejected'
        });
    }
    next();
};

const validateApprovalQuery = (req, res, next) => {
    if (req.query.decision !== undefined &&
        !['pending', 'approved', 'rejected'].includes(req.query.decision)) {
        return res.status(400).json({
            success: false,
            message: 'Decision filter must be pending, approved, or rejected'
        });
    }
    next();
};

module.exports = {
    decisions,
    validatePassId,
    validateDecision,
    validateApprovalStatus,
    validateApprovalQuery
};