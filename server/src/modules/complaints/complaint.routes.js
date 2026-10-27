const express = require('express');
const complaintController = require('./complaint.controller');
const validation = require('./complaint.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);
router.post('/', authorize('student'), validation.validateCreate, complaintController.createComplaint);
router.get('/me', authorize('student'), complaintController.getMyComplaints);
router.get('/', authorize('warden'), validation.validateWardenFilter, complaintController.getWardenComplaints);
router.get('/:id', authorize('student', 'warden'), validation.validateId, complaintController.getComplaint);
router.patch('/:id/status', authorize('warden'), validation.validateId,
    validation.validateStatus, complaintController.updateStatus);
router.patch('/:id/confirm', authorize('student'), validation.validateId, complaintController.confirmResolved);
router.patch('/:id/reopen', authorize('student'), validation.validateId, complaintController.reopen);

module.exports = router;