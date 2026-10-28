const guardModel = require('./guard.model.js');

const approvePass = async (id, approverId) => {
    return await guardModel.approvePass(id, approverId);
}

const getPassById = async (id) => {
    return await guardModel.getPassById(id);
}

const updatePassbyId = async (id, passData) => {
    return await guardModel.updatePassbyId(id, passData);
}

const getPendingApprovals = async () => {
    return await guardModel.getPendingApprovals();
}
const getApprovedPasses = async () => {
    return await guardModel.getApprovedPasses();
}

const getRejectedPasses = async () => {
    return await guardModel.getRejectedPasses();
}
const getCurrentGuard = async (id) => {
    return await guardModel.getCurrentGuard(id);
}

const updateGateStatus = async (id, action, guardUserId) => {
    return guardModel.updateGateStatus(id, action, guardUserId);
}

const getGatePasses = () => guardModel.getGatePasses();

module.exports = {
    approvePass,
    getPassById,
    updatePassbyId,
    getPendingApprovals,
    getApprovedPasses,
    getRejectedPasses,
    getCurrentGuard,
    updateGateStatus,
    getGatePasses
}