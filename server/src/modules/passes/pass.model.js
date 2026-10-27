const { supabase } = require('../../config/db');

const getStudentByUserId = async (userId) => {
    const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw error;
    return data;
};

const createPass = async (studentId, passData) => {
    const { data, error } = await supabase
        .from('passes')
        .insert([{ ...passData, student_id: studentId, status: 'pending' }])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') error.statusCode = 409;
        throw error;
    }

    const { error: approvalError } = await supabase
        .from('pass_approvals')
        .insert([{
            pass_id: data.id,
            stage: 'warden',
            decision: 'pending'
        }]);

    if (approvalError) {
        await supabase.from('passes').delete().eq('id', data.id);
        throw approvalError;
    }

    return data;
}

const getAllPasses = async (studentId) => {
    let query = supabase
        .from('passes')
        .select('*');
    if (studentId !== undefined && studentId !== null) {
        query = query.eq('student_id', studentId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
        throw error;
    }
    return data;
}

const getPassById = async (id, studentId) => {
    let query = supabase
        .from('passes')
        .select('*')
        .eq('id', id);
    if (studentId !== undefined && studentId !== null) {
        query = query.eq('student_id', studentId);
    }
    const { data, error } = await query.maybeSingle();

    if (error) {
        throw error;
    }
    if (!data) {
        const notFound = new Error('Pass not found');
        notFound.statusCode = 404;
        throw notFound;
    }
    return data;
}

const updatePassbyId = async (id, passData, studentId) => {
    let query = supabase
        .from('passes')
        .update(passData)
        .eq('id', id);
    if (studentId !== undefined && studentId !== null) {
        query = query.eq('student_id', studentId);
    }
    const { data, error } = await query
        .select()
        .maybeSingle();

    if (error) {
        throw error;
    }
    if (!data) {
        const notFound = new Error('Pass not found');
        notFound.statusCode = 404;
        throw notFound;
    }
    return data;
}

const deletePassbyId = async (id, studentId) => {
    let query = supabase
        .from('passes')
        .delete()
        .eq('id', id);
    if (studentId !== undefined && studentId !== null) {
        query = query.eq('student_id', studentId);
    }
    const { data, error } = await query
        .select()
        .maybeSingle();

    if (error) {
        throw error;
    }
    if (!data) {
        const notFound = new Error('Pass not found');
        notFound.statusCode = 404;
        throw notFound;
    }
    return data;
}

module.exports = {
    getStudentByUserId,
    createPass,
    getAllPasses,
    getPassById,
    updatePassbyId,
    deletePassbyId
}