const { supabase } = require('../../config/db');

const getPendingStudentRegistrations = async () => {
    const { data: studentRole, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .ilike('name', 'student')
        .maybeSingle();

    if (roleError) throw roleError;
    if (!studentRole) return [];

    const { data: pendingRoles, error: pendingRolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role_id', studentRole.id)
        .eq('approval_status', 'pending');

    if (pendingRolesError) throw pendingRolesError;
    if (!pendingRoles || pendingRoles.length === 0) return [];

    const userIds = pendingRoles.map(({ user_id }) => user_id);
    const [{ data: users, error: usersError }, { data: students, error: studentsError }] = await Promise.all([
        supabase
            .from('users')
            .select('id, name, email, phone')
            .in('id', userIds),
        supabase
            .from('students')
            .select('user_id, roll_number, admission_number, college_email, branch, academic_year, room_no, block_no, batch, course')
            .in('user_id', userIds)
    ]);

    if (usersError) throw usersError;
    if (studentsError) throw studentsError;

    const studentByUserId = new Map((students || []).map(({ room_no, ...student }) => [
        String(student.user_id),
        { ...student, room_number: room_no }
    ]));
    return (users || []).map((user) => ({
        ...user,
        student: studentByUserId.get(String(user.id)) || null,
        approval_status: 'pending'
    }));
};

const decideStudentRegistration = async (userId, approvalStatus) => {
    const { data: studentRole, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .ilike('name', 'student')
        .maybeSingle();

    if (roleError) throw roleError;
    if (!studentRole) {
        const error = new Error('Student role not found');
        error.statusCode = 404;
        throw error;
    }

    const { data, error } = await supabase
        .from('user_roles')
        .update({ approval_status: approvalStatus })
        .eq('user_id', userId)
        .eq('role_id', studentRole.id)
        .eq('approval_status', 'pending')
        .select('user_id, role_id, approval_status')
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const notPendingError = new Error('Pending student registration not found');
        notPendingError.statusCode = 404;
        throw notPendingError;
    }
    return data;
};

const approvePass = async (passId, decision) => {
    const { data, error } = await supabase
        .from('pass_approvals')
        .update({
            decision,
            decided_at: new Date().toISOString()
        })
        .eq('pass_id', passId)
        .eq('stage', 'warden')
        .eq('decision', 'pending')
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') error.statusCode = 409;
        throw error;
    }

    const { data: pass, error: passError } = await supabase
        .from('passes')
        .update({ status: decision })
        .eq('id', passId)
        .select()
        .single();

    if (passError) {
        await supabase
            .from('pass_approvals')
            .update({ decision: 'pending', decided_at: null })
            .eq('pass_id', passId)
            .eq('stage', 'warden')
            .eq('decision', decision);
        if (passError.code === 'PGRST116') passError.statusCode = 404;
        throw passError;
    }

    return { approval: data, pass };
};

const getCurrentWarden = async()=>{
    const { data, error } = await supabase
        .from('wardens')
        .select('*')
        .eq('is_current', true)
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

const getPendingApprovals = async()=>{
    const { data, error } = await supabase
        .from('pass_approvals')
        .select('*')
        .eq('stage', 'warden')
        .eq('decision', 'pending');

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

const getApprovedPasses = async()=>{
    const { data, error } = await supabase
        .from('pass_approvals')
        .select('*')
        .eq('stage', 'warden')
        .eq('decision', 'approved');

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

const getRejectedPasses = async()=>{
    const { data, error } = await supabase
        .from('pass_approvals')
        .select('*')
        .eq('stage', 'warden')
        .eq('decision', 'rejected');

    if (error) {
        throw new Error(error.message);
    }
    return data;
}


const updatePassById = async (passId, passData) => {
    const { data, error } = await supabase
        .from('passes')
        .update(passData)
        .eq('id', passId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

const getAllPasses = async () => {
    const { data, error } = await supabase
        .from('passes')
        .select('*');

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

const getPassById = async (passId) => {
    const { data, error } = await supabase
        .from('passes')
        .select('*')
        .eq('id', passId)
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

const getStudentRoleId = async () => {
    const { data, error } = await supabase
        .from('roles')
        .select('id')
        .ilike('name', 'student')
        .maybeSingle();
    if (error) throw error;
    return data ? data.id : null;
};

// Every student account (pending, approved, rejected) with login + hostel details.
const getStudentAccounts = async () => {
    const roleId = await getStudentRoleId();
    if (!roleId) return [];

    const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, approval_status')
        .eq('role_id', roleId);
    if (rolesError) throw rolesError;
    if (!roles || roles.length === 0) return [];

    const userIds = roles.map((role) => role.user_id);
    const [{ data: users, error: usersError }, { data: students, error: studentsError }] = await Promise.all([
        supabase.from('users').select('id, name, email, phone, is_active').in('id', userIds),
        supabase
            .from('students')
            .select('id, user_id, roll_number, admission_number, college_email, branch, academic_year, room_no, block_no, batch, course, created_at')
            .in('user_id', userIds)
    ]);
    if (usersError) throw usersError;
    if (studentsError) throw studentsError;

    const userById = new Map((users || []).map((user) => [String(user.id), user]));
    const studentByUserId = new Map((students || []).map(({ room_no, ...student }) => [
        String(student.user_id),
        { ...student, room_number: room_no }
    ]));

    return roles
        .filter((role) => userById.has(String(role.user_id)))
        .map((role) => {
            const student = studentByUserId.get(String(role.user_id)) || null;
            return {
                ...userById.get(String(role.user_id)),
                approval_status: role.approval_status,
                student_id: student ? student.id : null,
                student
            };
        });
};

// Removes a student account and everything recorded against it.
const deleteStudentAccount = async (userId) => {
    const roleId = await getStudentRoleId();
    const { data: role, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .maybeSingle();
    if (roleError) throw roleError;
    if (!role) {
        const notFound = new Error('Student account not found');
        notFound.statusCode = 404;
        throw notFound;
    }

    const run = async (query) => {
        const { error } = await query;
        if (error) {
            if (error.code === '23503') {
                const conflict = new Error('This student still has linked records that could not be removed');
                conflict.statusCode = 409;
                throw conflict;
            }
            throw error;
        }
    };

    const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
    if (studentError) throw studentError;

    if (student) {
        const { data: passes, error: passesError } = await supabase
            .from('passes')
            .select('id')
            .eq('student_id', student.id);
        if (passesError) throw passesError;
        const passIds = (passes || []).map((pass) => pass.id);
        if (passIds.length) {
            await run(supabase.from('pass_approvals').delete().in('pass_id', passIds));
            await run(supabase.from('passes').delete().in('id', passIds));
        }
        await run(supabase.from('complaints').delete().eq('student_id', student.id));
        await run(supabase.from('food_reviews').delete().eq('student_id', student.id));
        await run(supabase.from('students').delete().eq('id', student.id));
    }
    await run(supabase.from('user_roles').delete().eq('user_id', userId));
    await run(supabase.from('users').delete().eq('id', userId));
    return { user_id: userId };
};

module.exports = {
    getStudentAccounts,
    deleteStudentAccount,
    getPendingStudentRegistrations,
    decideStudentRegistration,
    approvePass,
    getCurrentWarden,
    getPendingApprovals,
    getApprovedPasses,
    getRejectedPasses,
    updatePassById,
    getAllPasses,
    getPassById
}
