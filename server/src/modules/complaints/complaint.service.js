const complaintModel = require('./complaint.model.js');

const transitions = {
    Pending: ['In Progress'],
    'In Progress': ['Awaiting Confirmation'],
    'Awaiting Confirmation': ['Resolved', 'Reopened'],
    Reopened: ['In Progress'],
    Resolved: []
};

const notFound = (message) => {
    const error = new Error(message);
    error.statusCode = 404;
    return error;
};

const getStudentOrThrow = async (userId) => {
    const student = await complaintModel.getStudentByUserId(userId);
    if (!student) throw notFound('Student profile not found');
    return student;
};

const createComplaint = async (userId, data) => {
    const student = await getStudentOrThrow(userId);
    return complaintModel.createComplaint(student.id, data);
};

const getMyComplaints = async (userId) => {
    const student = await getStudentOrThrow(userId);
    return complaintModel.getStudentComplaints(student.id);
};

const getComplaintForStudent = async (userId, id) => {
    const student = await getStudentOrThrow(userId);
    const complaint = await complaintModel.getComplaintById(id);
    if (!complaint) throw notFound('Complaint not found');
    if (complaint.student_id !== student.id) {
        const error = new Error('Access denied');
        error.statusCode = 403;
        throw error;
    }
    return complaint;
};

const getWardenComplaints = async (filters) => {
    const complaints = await complaintModel.getWardenComplaints(filters);
    return complaints.map((complaint) => ({
        id: complaint.id,
        room_number: complaint.students && complaint.students.room_no,
        block_number: complaint.students && complaint.students.block_no,
        category: complaint.category,
        problem_description: complaint.problem_description,
        status: complaint.status,
        submitted_at: complaint.submitted_at
    }));
};
const getComplaint = async (id) => {
    const complaint = await complaintModel.getComplaintById(id);
    if (!complaint) throw notFound('Complaint not found');
    return complaint;
};

const getWardenComplaint = async (id) => {
    const complaint = await getComplaint(id);
    return {
        id: complaint.id,
        room_number: complaint.students && complaint.students.room_no,
        block_number: complaint.students && complaint.students.block_no,
        category: complaint.category,
        problem_title: complaint.problem_title,
        problem_description: complaint.problem_description,
        status: complaint.status,
        submitted_at: complaint.submitted_at,
        completed_at: complaint.completed_at,
        resolved_at: complaint.resolved_at
    };
};

const updateStatus = async (id, status) => {
    const complaint = await getComplaint(id);
    if (!transitions[complaint.status] || !transitions[complaint.status].includes(status)) {
        const error = new Error(`Invalid status transition from ${complaint.status} to ${status}`);
        error.statusCode = 409;
        throw error;
    }
    const updates = { status };
    if (status === 'Awaiting Confirmation') updates.completed_at = new Date().toISOString();
    if (status === 'Resolved') updates.resolved_at = new Date().toISOString();
    if (status === 'Reopened') {
        updates.resolved_at = null;
        updates.completed_at = null;
    }
    return complaintModel.updateComplaint(id, updates);
};

const confirmResolved = (userId, id) => getComplaintForStudent(userId, id)
    .then(() => updateStatus(id, 'Resolved'));
const reopen = (userId, id) => getComplaintForStudent(userId, id)
    .then(() => updateStatus(id, 'Reopened'));

module.exports = {
    createComplaint,
    getMyComplaints,
    getComplaintForStudent,
    getWardenComplaints,
    getComplaint,
    getWardenComplaint,
    updateStatus,
    confirmResolved,
    reopen,
    transitions
};