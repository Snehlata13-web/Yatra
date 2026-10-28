const guardService = require('./guard.service');

const handleError = (res, error) => res.status(error.statusCode || 500).json({
    success: false,
    message: error.message
});

const approvePass = async (req, res) => {
    try {
        const approval = await guardService.approvePass(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: approval });
    } catch (error) {
        handleError(res, error);
    }
};

const updateGateStatus = async (req, res) => {
    try {
        const pass = await guardService.updateGateStatus(req.params.id, req.body.action);
        res.status(200).json({ success: true, data: pass });
    } catch (error) {
        handleError(res, error);
    }
};

const getPassById = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await guardService.getPassById(req.params.id)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const updatePassbyId = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await guardService.updatePassbyId(req.params.id, req.body)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getPendingApprovals = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await guardService.getPendingApprovals()
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getApprovedPasses = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await guardService.getApprovedPasses()
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getRejectedPasses = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await guardService.getRejectedPasses()
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getCurrentGuard = async (req, res) => {
    try {
        const guard = await guardService.getCurrentGuard(req.user.id);
        if (!guard) {
            return res.status(404).json({ success: false, message: 'Guard profile not found' });
        }
        res.status(200).json({ success: true, data: guard });
    } catch (error) {
        handleError(res, error);
    }
};

const getGatePasses = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await guardService.getGatePasses()
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    getGatePasses,
    approvePass,
    updateGateStatus,
    getPassById,
    updatePassbyId,
    getPendingApprovals,
    getApprovedPasses,
    getRejectedPasses,
    getCurrentGuard
};
