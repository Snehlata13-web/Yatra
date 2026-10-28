const express = require('express');
const noticeController = require('./notice.controller.js');
const noticeValidation = require('./notice.validation.js');
const { authenticate } = require('../../middleware/auth.middleware.js');
const { authorize } = require('../../middleware/role.middleware.js');

const router = express.Router();

router.use(authenticate);
router.get('/', authorize('student', 'warden'), noticeController.getNotices);
router.get('/:id', authorize('student', 'warden'),
    noticeValidation.validateNoticeId, noticeController.getNoticeById);
router.post('/uploads/sign', authorize('warden'),
    noticeValidation.validateUpload, noticeController.signUpload);
router.post('/', authorize('warden'),
    noticeValidation.validateCreate, noticeController.createNotice);

module.exports = router;
