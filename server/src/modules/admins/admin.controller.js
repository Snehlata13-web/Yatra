const adminService = require('./admin.service.js');

const updateApprovalStatus = async (req, res) => {
	try {
		const result = await adminService.updateApprovalStatus(
			req.params.userId,
			req.body.approval_status
		);
		res.status(200).json({
			success: true,
			data: result
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message
		});
	}
};

const getPendingStaffAccounts = async (req, res) => {
	try {
		const accounts = await adminService.getPendingStaffAccounts();
		res.status(200).json({
			success: true,
			data: accounts
		});
	} catch (error) {
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message
		});
	}
};

module.exports = {
	updateApprovalStatus,
	getPendingStaffAccounts
};