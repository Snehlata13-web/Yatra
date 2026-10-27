const { supabase } = require('../../config/db.js');

const getStudentById = async (id) => {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === '23505') error.statusCode = 409;
        throw error;
    }
    return data;
}

const updateStudentById = async (id, studentData) => {
    const { data, error } = await supabase
        .from('students')
        .update(studentData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') error.statusCode = 409;
        throw error;
    }
    return data;
}

const deleteStudentById = async (id) => {
    const { data, error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
}

const getAllStudents = async () => {
    const { data, error } = await supabase
        .from('students')
        .select('*');

    if (error) {
        throw error;
    }
    return data;
}

const getCurrentStudent = async (id) => {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

    if (error) {
        throw error;
    }
    return data;
}

const updateCurrentStudent = async (userId, studentData) => {
    const { data, error } = await supabase
        .from('students')
        .update(studentData)
        .eq('user_id', userId)
        .select()
        .single();
    if (error) {
        if (error.code === '23505') error.statusCode = 409;
        throw error;
    }
    return data;
};

module.exports = {
    getStudentById,
    updateStudentById,
    deleteStudentById,
    getAllStudents,
    getCurrentStudent,
    updateCurrentStudent
};