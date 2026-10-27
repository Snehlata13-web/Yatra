const approvalService = require('./approval.service.js');

const handleError = (res, error) => res.status(error.statusCode || 500).json({
    success: false,
    message: error.message
});

const getApprovals = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await approvalService.getApprovals(req.query.decision)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getApprovalByPassId = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await approvalService.getApprovalByPassId(req.params.passId)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const decideApproval = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await approvalService.decideApproval(
                req.params.passId,
                req.body.decision,
                req.user.id
            )
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    getApprovals,
    getApprovalByPassId,
    decideApproval
};