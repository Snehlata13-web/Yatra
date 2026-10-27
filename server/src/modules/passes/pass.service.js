const passModel = require('./pass.model');

const createPass = async (userId, passData) => {
    const student = await passModel.getStudentByUserId(userId);
    if (!student) {
        const error = new Error('Student profile not found');
        error.statusCode = 404;
        throw error;
    }
    return passModel.createPass(student.id, passData);
}

const getStudentId = async (userId) => {
    const student = await passModel.getStudentByUserId(userId);
    if (!student) {
        const error = new Error('Student profile not found');
        error.statusCode = 404;
        throw error;
    }
    return student.id;
};

const getAllPasses = async (user) => {
    const studentId = user.role === 'student' ? await getStudentId(user.id) : null;
    return passModel.getAllPasses(studentId);
};

const getPassById = async (id, user) => {
    const studentId = user.role === 'student' ? await getStudentId(user.id) : null;
    return passModel.getPassById(id, studentId);
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