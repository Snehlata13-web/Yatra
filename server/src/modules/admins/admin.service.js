const adminModel = require('./admin.model.js');

const updateApprovalStatus = async (userId, approvalStatus) => {
	if (!['approved', 'rejected'].includes(approvalStatus)) {
		throw new Error('Approval status must be approved or rejected');
	}
	return adminModel.updateApprovalStatus(userId, approvalStatus);
};

const getPendingStaffAccounts = () => adminModel.getPendingStaffAccounts();

module.exports = {
	updateApprovalStatus,
	getPendingStaffAccounts
};