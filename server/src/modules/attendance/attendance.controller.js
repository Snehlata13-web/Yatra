const attendanceService = require('./attendance.service.js');

const handleError = (res, error) => res.status(error.statusCode || 500).json({
    success: false,
    message: error.message
});

const markAttendance = async (req, res) => {
    try {
        res.status(201).json({ success: true, data: await attendanceService.markAttendance(req.user.id) });
    } catch (error) {
        handleError(res, error);
    }
};

const getMyAttendance = async (req, res) => {
    try {
        const days = req.query.days ? Number(req.query.days) : 30;
        res.status(200).json({ success: true, data: await attendanceService.getMyAttendance(req.user.id, days) });
    } catch (error) {
        handleError(res, error);
    }
};

const getAttendanceForDate = async (req, res) => {
    try {
        res.status(200).json({ success: true, data: await attendanceService.getAttendanceForDate(req.query.date) });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    markAttendance,
    getMyAttendance,
    getAttendanceForDate
};
