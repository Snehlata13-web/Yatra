const wardenModel = require('./warden.model');

const approvePass = async (id, decision = 'approved') => {
    const approval = await wardenModel.approvePass(id, decision);
    if (!approval) {
        const error = new Error('Pending warden approval not found');
        error.statusCode = 409;
        throw error;
    }
    return approval;
}
const getCurrentWarden = async (id) => {
    const warden = await wardenModel.getCurrentWarden(id);
    if (!warden) {
        throw new Error('Warden not found');
    }
    return warden;
}

const getPendingApprovals = async (wardenId) => {
    const pendingApprovals = await wardenModel.getPendingApprovals(wardenId);
    return pendingApprovals;
}

const getApprovedPasses = async (wardenId) => {
    const approvedPasses = await wardenModel.getApprovedPasses(wardenId);
    return approvedPasses;
}

const getRejectedPasses = async (wardenId) => {
    const rejectedPasses = await wardenModel.getRejectedPasses(wardenId);
    return rejectedPasses;
}

const updatePassById = async (id, passData) => {
    const updatedPass = await wardenModel.updatePassById(id, passData);
    if (!updatedPass) {
        throw new Error('Pass not found');
    }
    return updatedPass;
}

const getAllPasses = async () => {
    const passes = await wardenModel.getAllPasses();
    return passes;
}

const getPassById = async (id) => {
    const pass = await wardenModel.getPassById(id);
    if (!pass) {
        throw new Error('Pass not found');
    }
    return pass;
}

module.exports = {
    approvePass,
    getCurrentWarden,
    getPendingApprovals,
    getApprovedPasses,
    getRejectedPasses,
    updatePassById,
    getAllPasses,
    getPassById
}
