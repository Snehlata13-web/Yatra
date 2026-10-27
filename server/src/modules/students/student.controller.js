const studentService = require('./student.service.js');

const updateStudentById = async (req, res) => {
    try{
        const student = await studentService.updateStudentById(req.params.id, req.body);
        res.status(200).json({
            success : true,
            data : student
        })
    }
    catch(error){
        res.status(500).json({
            success : false,
            message : error.message
        });
    }
}

const getStudentById = async (req, res) => {
    try{
        const student = await studentService.getStudentById(req.params.id);
        res.status(200).json({
            success : true,
            data : student
        })
    }
    catch(error){
        res.status(500).json({
            success : false,
            message : error.message
        });
    }
}

const deleteStudentById = async (req, res) => {
    try{
        const student = await studentService.deleteStudentById(req.params.id);
        res.status(200).json({
            success : true,
            data : student
        })
    }
    catch(error){
        res.status(500).json({
            success : false,
            message : error.message
        });
    }
}
const getAllStudents = async (req, res) => {
    try{
        const students = await studentService.getAllStudents();
        res.status(200).json({
            success : true,
            data : students
        })
    }
    catch(error){
        res.status(500).json({
            success : false,
            message : error.message
        });
    }
}
const getCurrentStudent = async (req, res) => {
    try{
        const student = await studentService.getCurrentStudent(req.user.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }
        res.status(200).json({
            success : true,
            data : student
        })
    }
    catch(error){
        res.status(error.statusCode || 500).json({
            success : false,
            message : error.message
        });
    }
}

const updateCurrentStudent = async (req, res) => {
    try {
        const student = await studentService.updateCurrentStudent(req.user.id, req.body);
        res.status(200).json({ success: true, data: student });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
}

module.exports = {
    updateStudentById,
    getStudentById,
    deleteStudentById,
    getAllStudents,
    getCurrentStudent,
    updateCurrentStudent
}
