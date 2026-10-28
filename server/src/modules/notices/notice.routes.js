const express = require('express');
const noticeController = require('./notice.controller.js');
const noticeValidation = require('./notice.validation.js');
const { authenticate } = require('../../middleware/auth.middleware.js');
const { authorize } = require('../../middleware/role.middleware.js');

const router = express.Router();

router.use(authenticate);
router.get('/', authorize('student', 'warden','admin'), noticeController.getNotices);
router.get('/:id', authorize('student', 'warden','admin'),
    noticeValidation.validateNoticeId, noticeController.getNoticeById);
router.post('/uploads/sign', authorize('warden'),
    noticeValidation.validateUpload, noticeController.signUpload);
router.post('/', authorize('warden'),
    noticeValidation.validateCreate, noticeController.createNotice);
router.put('/:id', authorize('warden'), noticeValidation.validateNoticeId,
    noticeValidation.validateCreate, noticeController.updateNotice);
router.delete('/:id', authorize('warden'), noticeValidation.validateNoticeId,
    noticeController.deleteNotice);

module.exports = router;
