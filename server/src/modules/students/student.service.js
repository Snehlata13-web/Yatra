const studentModel = require('./student.model.js');

const updateStudentById = async (id, studentData) => {
    return await studentModel.updateStudentById(id, studentData);
}

const getStudentById = async (id) => {
    return await studentModel.getStudentById(id);
}

const deleteStudentById = async (id) => {
    return await studentModel.deleteStudentById(id);
}

const getAllStudents = async () => {
    return await studentModel.getAllStudents();
}

const getCurrentStudent = async (id) => {
    return await studentModel.getCurrentStudent(id);
}
const updateCurrentStudent = async (id, studentData) => {
    return await studentModel.updateCurrentStudent(id, studentData);
}
module.exports = {
    updateStudentById,
    getStudentById,
    deleteStudentById,
    getAllStudents,
    getCurrentStudent,
    updateCurrentStudent
}