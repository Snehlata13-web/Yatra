const approvalModel = require('./approval.model.js');

const notFound = (message) => {
    const error = new Error(message);
    error.statusCode = 404;
    return error;
};

const getApprovals = (decision) => approvalModel.getApprovals(decision);

const getApprovalByPassId = async (passId) => {
    const approval = await approvalModel.getApprovalByPassId(passId);
    if (!approval) throw notFound('Approval not found');
    return approval;
};

const decideApproval = async (passId, decision, approverId) => {
    const approval = await approvalModel.getApprovalByPassId(passId);
    if (!approval) throw notFound('Approval not found');
    if (approval.stage !== 'warden') {
        const error = new Error('Approval stage is not supported');
        error.statusCode = 409;
        throw error;
    }
    if (approval.decision !== 'pending') {
        const error = new Error('Approval has already been processed');
        error.statusCode = 409;
        throw error;
    }

    const updatedApproval = await approvalModel.updatePendingApproval(
        passId,
        decision,
        approverId
    );
    try {
        const pass = await approvalModel.updatePassStatus(passId, decision);
        let guardApproval = null;
        if (decision === 'approved') {
            guardApproval = await approvalModel.createGuardApproval(passId);
        }
        return { approval: updatedApproval, guardApproval, pass };
    } catch (error) {
        await approvalModel.restorePendingApproval(passId, decision);
        throw error;
    }
};

module.exports = {
    getApprovals,
    getApprovalByPassId,
    decideApproval
};