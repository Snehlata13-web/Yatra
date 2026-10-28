const express = require('express');
const wardenController = require('./warden.controller');
const { authorize } = require('../../middleware/role.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const wardenValidation = require('./warden.validation');
const adminValidation = require('../admins/admin.validation');

const router = express.Router();

router.use(authenticate);
router.get('/students/pending', authorize('warden','admin'), wardenController.getPendingStudentRegistrations);
router.get('/students', authorize('warden','admin'), wardenController.getStudentAccounts);
router.delete('/students/:userId', authorize('warden','admin'), wardenValidation.validateUserId,
    wardenController.deleteStudentAccount);
router.patch('/students/:userId/approval', authorize('warden','admin'),
    wardenValidation.validateUserId, adminValidation.validateApprovalStatus,
    wardenController.decideStudentRegistration);
router.put('/approve/:id', authorize('warden'), wardenValidation.validatePassId,
    wardenValidation.validateApprovalDecision, wardenController.approvePass);
router.put('/reject/:id', authorize('warden'), wardenValidation.validatePassId,
    (req, res, next) => {
        req.body = { decision: 'rejected' };
        next();
    }, wardenController.approvePass);
router.put('/update/:id', authorize('warden'), wardenValidation.validatePassId,
    wardenValidation.validatePassUpdate, wardenController.updatePassbyId);
router.get('/pending', authorize('warden'), wardenController.getPendingApprovals);
router.get('/approved', authorize('warden'), wardenController.getApprovedPasses);
router.get('/rejected', authorize('warden'), wardenController.getRejectedPasses);
router.get('/all', authorize('warden'), wardenController.getAllPasses);
router.get('/me', authorize('warden'), wardenController.getCurrentWarden);
router.get('/:id', authorize('warden'), wardenValidation.validatePassId,
    wardenController.getPassById);

module.exports = router;