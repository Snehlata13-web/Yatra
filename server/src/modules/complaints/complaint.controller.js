const complaintService = require('./complaint.service.js');

const handleError = (res, error) => res.status(error.statusCode || 500).json({
    success: false,
    message: error.message
});

const createComplaint = async (req, res) => {
    try {
        const complaint = await complaintService.createComplaint(req.user.id, req.body);
        res.status(201).json({ success: true, data: complaint });
    } catch (error) {
        handleError(res, error);
    }
};

const getMyComplaints = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await complaintService.getMyComplaints(req.user.id)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getWardenComplaints = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await complaintService.getWardenComplaints(req.query)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getComplaint = async (req, res) => {
    try {
        const complaint = req.user.role === 'student'
            ? await complaintService.getComplaintForStudent(req.user.id, req.params.id)
            : await complaintService.getWardenComplaint(req.params.id);
        res.status(200).json({ success: true, data: complaint });
    } catch (error) {
        handleError(res, error);
    }
};

const updateStatus = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await complaintService.updateStatus(req.params.id, req.body.status)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const confirmResolved = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await complaintService.confirmResolved(req.user.id, req.params.id)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const reopen = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await complaintService.reopen(req.user.id, req.params.id)
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    createComplaint,
    getMyComplaints,
    getWardenComplaints,
    getComplaint,
    updateStatus,
    confirmResolved,
    reopen
};