const passController = require('./pass.controller');
const express = require('express');
const router = express.Router();
const wardenController = require('../wardens/warden.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const validation = require('./pass.validation');

router.use(authenticate);
router.post('/', authorize('student'), validation.createPassSchema, passController.createPass);
router.get('/', authorize('student', 'warden','admin'), passController.getAllPasses);
router.get('/:id', authorize('student', 'warden','admin'), validation.passIdSchema,
    passController.getPassById);
router.put('/:id', authorize('student'), validation.passIdSchema,
    validation.updatePassSchema, passController.updatePassbyId);
router.delete('/:id', authorize('student'), validation.passIdSchema,
    passController.deletePassbyId);
router.post('/:id/approve', authorize('warden'), validation.passIdSchema,
    validation.approvePassSchema, wardenController.approvePass);
router.post('/:id/reject', authorize('warden'), validation.passIdSchema,
    validation.approvePassSchema, (req, res, next) => {
        req.body.decision = 'rejected';
        next();
    }, wardenController.approvePass);

module.exports = router;
