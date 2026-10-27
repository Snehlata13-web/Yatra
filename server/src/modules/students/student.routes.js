const express = require('express');
const studentController = require('./student.controller');
const studentValidation = require('./student.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);
router.get('/me', authorize('student'), studentController.getCurrentStudent);
router.put('/me', authorize('student'), studentValidation.validateStudentUpdate,
    studentController.updateCurrentStudent);
router.get('/:id', authorize('admin','warden'), studentValidation.validateStudentId,
    studentController.getStudentById);
router.put('/:id', authorize('admin','warden'), studentValidation.validateStudentId,
    studentValidation.validateStudentUpdate, studentController.updateStudentById);
router.delete('/:id', authorize('admin','warden'), studentValidation.validateStudentId,
    studentController.deleteStudentById);
router.get('/', authorize('admin','warden'), studentController.getAllStudents);
module.exports = router;