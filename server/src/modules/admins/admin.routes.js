const express = require('express');
const adminController = require('./admin.controller.js');
const authenticate = require('../../middleware/auth.middleware.js');
const authorize = require('../../middleware/role.middleware.js');
const adminValidation = require('./admin.validation.js');

const router = express.Router();

router.get(
	'/users/pending',
	authenticate.authenticate,
	authorize.authorize('admin'),
	adminController.getPendingStaffAccounts
);

router.patch(
	'/users/:userId/approval',
	authenticate.authenticate,
	authorize.authorize('admin'),
	adminValidation.validateApprovalStatus,
	adminController.updateApprovalStatus
);

module.exports = {
	router
};