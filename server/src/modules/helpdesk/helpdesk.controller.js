const helpdeskService = require('./helpdesk.service.js');

const handleError = (res, error) => res.status(error.statusCode || 500).json({
    success: false,
    message: error.message
});

const createHelpRequest = async (req, res) => {
    try {
        res.status(201).json({
            success: true,
            data: await helpdeskService.createHelpRequest(req.user.id, req.body)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getHelpRequests = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await helpdeskService.getHelpRequests()
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getHelpRequestById = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await helpdeskService.getHelpRequestById(req.params.id)
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    createHelpRequest,
    getHelpRequests,
    getHelpRequestById
};