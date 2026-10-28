const passModel = require('./pass.model');
const { attachStudentDetails } = require('../../utils/studentDetails.js');
const createPass = async (userId, passData) => {
    const student = await passModel.getStudentByUserId(userId);
    if (!student) {
        const error = new Error('Student profile not found');
        error.statusCode = 404;
        throw error;
    }
    return passModel.createPass(student.id, passData);
}
const getAllPasses = async (user) => {
    const studentId = user.role === 'student' ? await getStudentId(user.id) : null;
    const passes = await passModel.getAllPasses(studentId);
    // Wardens see who requested each pass (name, department, room…).
    return studentId === null ? attachStudentDetails(passes) : passes;
};

const getPassById = async (id, user) => {
    const studentId = user.role === 'student' ? await getStudentId(user.id) : null;
    const pass = await passModel.getPassById(id, studentId);
    return studentId === null ? attachStudentDetails(pass) : pass;
};
const getStudentId = async (userId) => {
    const student = await passModel.getStudentByUserId(userId);
    if (!student) {
        const error = new Error('Student profile not found');
        error.statusCode = 404;
        throw error;
    }
    return student.id;
};


const updatePassbyId = async (id, passData, user) => {
    const studentId = user.role === 'student' ? await getStudentId(user.id) : null;
    return passModel.updatePassbyId(id, passData, studentId);
};

const deletePassbyId = async (id, user) => {
    const studentId = user.role === 'student' ? await getStudentId(user.id) : null;
    return passModel.deletePassbyId(id, studentId);
}

module.exports = {
    createPass,
    getAllPasses,
    getPassById,
    updatePassbyId,
    deletePassbyId
}