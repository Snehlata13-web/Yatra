const validateApprovalStatus = (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some((field) => field !== 'approval_status') ||
        !['approved', 'rejected'].includes(body.approval_status)) {
        return res.status(400).json({
            success: false,
            message: 'approval_status must be approved or rejected'
        });
    }
    next();
};

module.exports = { validateApprovalStatus };