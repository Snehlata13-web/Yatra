const express = require('express');
const guardController = require('./guard.controller');
const { authorize } = require('../../middleware/role.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const guardValidation = require('./guard.validation');

const router = express.Router();

router.use(authenticate);
router.put('/approve/:id', authorize('guard'), guardValidation.validateId,
    guardController.approvePass);
router.patch('/:id/gate', authorize('guard'), guardValidation.validateId,
    guardValidation.validateGateAction, guardController.updateGateStatus);
router.get('/pending', authorize('guard'), guardController.getPendingApprovals);
router.get('/approved', authorize('guard'), guardController.getApprovedPasses);
router.get('/rejected', authorize('guard'), guardController.getRejectedPasses);
router.put('/update/:id', authorize('guard'), guardValidation.validateId,
    guardValidation.validatePassUpdate, guardController.updatePassbyId);
router.get('/me', authorize('guard'), guardController.getCurrentGuard);
router.get('/:id', authorize('guard'), guardValidation.validateId,
    guardController.getPassById);

module.exports = router;