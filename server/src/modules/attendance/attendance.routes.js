const express = require('express');
const attendanceController = require('./attendance.controller.js');
const { authenticate } = require('../../middleware/auth.middleware.js');
const { authorize } = require('../../middleware/role.middleware.js');

const router = express.Router();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const validateDateQuery = (req, res, next) => {
    const { date, days } = req.query;
    if (date !== undefined && (!datePattern.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)))) {
        return res.status(400).json({ success: false, message: 'date must be a valid YYYY-MM-DD date' });
    }
    if (days !== undefined && (!/^\d{1,3}$/.test(days) || Number(days) < 1 || Number(days) > 120)) {
        return res.status(400).json({ success: false, message: 'days must be between 1 and 120' });
    }
    next();
};

router.use(authenticate);
router.post('/mark', authorize('student'), attendanceController.markAttendance);
router.get('/me', authorize('student'), validateDateQuery, attendanceController.getMyAttendance);
router.get('/', authorize('warden', 'admin'), validateDateQuery, attendanceController.getAttendanceForDate);

module.exports = router;
