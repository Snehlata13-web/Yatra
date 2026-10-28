const { supabase } = require('../../config/db.js');

const findUserByEmail = async (email) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        if (error.code === '23505') error.statusCode = 409;
        throw error;
    }
    return data;
};

const findRoleByUserId = async (userId) => {
    const {data : userRole , error : userRoleError} = await supabase
        .from('user_roles')
        .select('role_id, approval_status')
        .eq('user_id', userId)
        .maybeSingle();

    if (userRoleError) {
        throw userRoleError;
    }

    if (!userRole) {
        return null;
    }

    const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', userRole.role_id)
        .maybeSingle();

    if (roleError) {
        throw roleError;
    }
    return {
        ...role,
        approval_status: userRole.approval_status
    };
};

const createUser = async (userData) => {
    const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') error.statusCode = 409;
        throw error;
    }
    return data;
};

const findRoleByName = async (roleName) => {
    const { data, error } = await supabase
        .from('roles')
        .select('*')
        .ilike('name', roleName)
        .maybeSingle();

    if (error) {
        throw error;
    }
    return data;
};

const assignRole = async (userId, roleId, approvalStatus) => {
    const { data, error } = await supabase
        .from('user_roles')
        .insert({
            user_id: userId,
            role_id: roleId,
            approval_status: approvalStatus
        })
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
};

const createStudentProfile = async (studentData) => {
    const { data, error } = await supabase
        .from('students')
        .insert(studentData)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') error.statusCode = 409;
        throw error;
    }
    return data;
};

const deleteStudentProfile = async (userId) => {
    const { error } = await supabase.from('students').delete().eq('user_id', userId);
    if (error) throw error;
};

const createWardenProfile = async (wardenData) => {
    const { data, error } = await supabase
        .from('wardens')
        .insert(wardenData)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') error.statusCode = 409;
        throw error;
    }
    return data;
};

const deleteWardenProfile = async (userId) => {
    const { error } = await supabase.from('wardens').delete().eq('user_id', userId);
    if (error) throw error;
};

const createGuardProfile = async (guardData) => {
    const { data, error } = await supabase
        .from('guards')
        .insert(guardData)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') error.statusCode = 409;
        throw error;
    }
    return data;
};

const deleteGuardProfile = async (userId) => {
    const { error } = await supabase.from('guards').delete().eq('user_id', userId);
    if (error) throw error;
};

const deleteUserRole = async (userId) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId);
    if (error) throw error;
};

const deleteUser = async (userId) => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
};

module.exports = {
    findUserByEmail,
    findRoleByUserId,
    createUser,
    findRoleByName,
    assignRole,
    createStudentProfile,
    deleteStudentProfile,
    createWardenProfile,
    deleteWardenProfile,
    createGuardProfile,
    deleteGuardProfile,
    deleteUserRole,
    deleteUser
};