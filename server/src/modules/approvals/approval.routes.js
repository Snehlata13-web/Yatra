const express = require('express');
const approvalController = require('./approval.controller.js');
const approvalValidation = require('./approval.validation.js');
const { authenticate } = require('../../middleware/auth.middleware.js');
const { authorize } = require('../../middleware/role.middleware.js');

const router = express.Router();

router.use(authenticate, authorize('warden'));
router.get('/', approvalValidation.validateApprovalQuery, approvalController.getApprovals);
router.get('/:passId', approvalValidation.validatePassId,
    approvalController.getApprovalByPassId);
router.patch('/:passId', approvalValidation.validatePassId,
    approvalValidation.validateDecision, approvalController.decideApproval);

module.exports = router;