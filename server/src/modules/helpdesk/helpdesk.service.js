const helpdeskModel = require('./helpdesk.model.js');

const getStudentOrThrow = async (userId) => {
    const student = await helpdeskModel.getStudentByUserId(userId);
    if (!student) {
        const error = new Error('Student profile not found');
        error.statusCode = 404;
        throw error;
    }
    return student;
};

const createHelpRequest = async (userId, helpData) => {
    const student = await getStudentOrThrow(userId);
    return helpdeskModel.createHelpRequest(student.id, helpData);
};

const getHelpRequests = () => helpdeskModel.getHelpRequests();

const getHelpRequestById = async (id) => {
    const helpRequest = await helpdeskModel.getHelpRequestById(id);
    if (!helpRequest) {
        const error = new Error('Help request not found');
        error.statusCode = 404;
        throw error;
    }
    return helpRequest;
};

module.exports = {
    createHelpRequest,
    getHelpRequests,
    getHelpRequestById
};