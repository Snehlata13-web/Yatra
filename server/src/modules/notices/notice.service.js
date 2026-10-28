const noticeModel = require('./notice.model.js');

const signUpload = (wardenUserId, uploadData) => noticeModel.createUploadUrl(wardenUserId, uploadData);

const createNotice = (wardenUserId, noticeData) => noticeModel.createNotice(wardenUserId, noticeData);

const getNotices = () => noticeModel.getNotices();

const getNoticeById = async (id) => {
    const notice = await noticeModel.getNoticeById(id);
    if (!notice) {
        const error = new Error('Notice not found');
        error.statusCode = 404;
        throw error;
    }
    return notice;
};

module.exports = {
    signUpload,
    createNotice,
    getNotices,
    getNoticeById
};
