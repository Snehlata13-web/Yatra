const { supabase } = require('../../config/db.js');

const complaintSelect = `
    id, student_id, category, problem_title, problem_description,
    status, submitted_at, completed_at, resolved_at,
    students!inner(room_number, block_number)
`;

const withConflictStatus = (error) => {
    if (error && error.code === '23505') error.statusCode = 409;
    return error;
};

const getStudentByUserId = async (userId) => {
    const { data, error } = await supabase
        .from('students')
        .select('id, room_number, block_number')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw error;
    return data;
};

const createComplaint = async (studentId, complaintData) => {
    const { data, error } = await supabase
        .from('complaints')
        .insert({ ...complaintData, student_id: studentId, status: 'Pending' })
        .select(complaintSelect)
        .single();
    if (error) throw withConflictStatus(error);
    return data;
};

const getStudentComplaints = async (studentId) => {
    const { data, error } = await supabase
        .from('complaints')
        .select(complaintSelect)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });
    if (error) throw error;
    return data;
};

const getComplaintById = async (id) => {
    const { data, error } = await supabase
        .from('complaints')
        .select(complaintSelect)
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    return data;
};

const getWardenComplaints = async ({ category, status, room_number }) => {
    let query = supabase
        .from('complaints')
        .select(complaintSelect)
        .order('submitted_at', { ascending: false });
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    if (room_number) query = query.eq('students.room_number', room_number);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

const updateComplaint = async (id, updates) => {
    const { data, error } = await supabase
        .from('complaints')
        .update(updates)
        .eq('id', id)
        .select(complaintSelect)
        .single();
    if (error) throw withConflictStatus(error);
    return data;
};

module.exports = {
    getStudentByUserId,
    createComplaint,
    getStudentComplaints,
    getComplaintById,
    getWardenComplaints,
    updateComplaint
};