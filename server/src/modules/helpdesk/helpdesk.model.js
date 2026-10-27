const { supabase } = require('../../config/db.js');

const publicFields = 'id, title, description, created_at';

const getStudentByUserId = async (userId) => {
    const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw error;
    return data;
};

const createHelpRequest = async (studentId, helpData) => {
    const { data, error } = await supabase
        .from('help_requests')
        .insert({ ...helpData, student_id: studentId })
        .select(publicFields)
        .single();
    if (error) {
        if (error.code === '23505') error.statusCode = 409;
        throw error;
    }
    return data;
};

const getHelpRequests = async () => {
    const { data, error } = await supabase
        .from('help_requests')
        .select(publicFields)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

const getHelpRequestById = async (id) => {
    const { data, error } = await supabase
        .from('help_requests')
        .select(publicFields)
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    return data;
};

module.exports = {
    getStudentByUserId,
    createHelpRequest,
    getHelpRequests,
    getHelpRequestById
};