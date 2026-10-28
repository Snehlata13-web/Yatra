const noticeService = require('./notice.service.js');

const handleError = (res, error) => res.status(error.statusCode || 500).json({
    success: false,
    message: error.message
});

const signUpload = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await noticeService.signUpload(req.user.id, req.body)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const createNotice = async (req, res) => {
    try {
        res.status(201).json({
            success: true,
            data: await noticeService.createNotice(req.user.id, req.body)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getNotices = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await noticeService.getNotices()
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getNoticeById = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await noticeService.getNoticeById(req.params.id)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const updateNotice = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await noticeService.updateNotice(req.params.id, req.user.id, req.body)
        });
    } catch (error) {
        handleError(res, error);
    }
};

const deleteNotice = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: await noticeService.deleteNotice(req.params.id)
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    updateNotice,
    deleteNotice,
    signUpload,
    createNotice,
    getNotices,
    getNoticeById
};
