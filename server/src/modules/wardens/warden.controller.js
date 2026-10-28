const wardenService = require('./warden.service');

const getPendingStudentRegistrations = async (req, res) => {
    try {
        const registrations = await wardenService.getPendingStudentRegistrations();
        res.status(200).json({ success: true, data: registrations });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

const decideStudentRegistration = async (req, res) => {
    try {
        const result = await wardenService.decideStudentRegistration(
            req.params.userId,
            req.body.approval_status
        );
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

const approvePass = async (req, res) => {
    try {
        const pass = await wardenService.approvePass(
            req.params.id,
            req.body.decision
        );
        res.status(200).json({
            success: true,
            data: pass
        })
    }
    catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}

const getPassById = async (req, res) => {
    try {
        const pass = await wardenService.getPassById(req.params.id);
        res.status(200).json({
            success: true,
            data: pass
        })
    }
    catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}

const updatePassbyId = async (req, res) => {
    try {
        const pass = await wardenService.updatePassbyId(req.params.id, req.body);
        res.status(200).json({
            success: true,
            data: pass
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
const getPendingApprovals = async (req, res) => {
    try {
        const passes = await wardenService.getPendingApprovals();
        res.status(200).json({
            success: true,
            data: passes
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getApprovedPasses = async (req, res) => {
    try {
        const passes = await wardenService.getApprovedPasses();
        res.status(200).json({
            success: true,
            data: passes
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getRejectedPasses = async (req, res) => {
    try {
        const passes = await wardenService.getRejectedPasses();
        res.status(200).json({
            success: true,
            data: passes
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getCurrentWarden = async (req, res) => {
    try {
        const warden = await wardenService.getCurrentWarden(req.user.id);
        res.status(200).json({
            success: true,
            data: warden
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
const updatePassById = async (req, res) => {
    try {
        const pass = await wardenService.updatePassById(req.params.id, req.body);
        res.status(200).json({
            success: true,
            data: pass
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getAllPasses = async (req, res) => {
    try {
        const passes = await wardenService.getAllPasses();
        res.status(200).json({
            success: true,
            data: passes
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    getPendingStudentRegistrations,
    decideStudentRegistration,
    approvePass,
    getAllPasses,
    getPassById,
    updatePassbyId,
    getPendingApprovals,
    getApprovedPasses,
    getRejectedPasses,
    getCurrentWarden
}