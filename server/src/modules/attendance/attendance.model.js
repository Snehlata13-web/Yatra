const { supabase } = require('../../config/db.js');

const fail = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getStudentByUserId = async (userId) => {
    const { data, error } = await supabase
        .from('students')
        .select('id, created_at')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw error;
    return data;
};

/** Passes that are currently OUT at the gate (or were, for history), for the given students. */
const getGatePasses = async (studentIds) => {
    if (!studentIds.length) return [];
    const { data, error } = await supabase
        .from('passes')
        .select('*')
        .eq('status', 'approved')
        .in('student_id', studentIds);
    if (error) throw error;
    return (data || []).filter((pass) => pass.current_stage === 'OUT' || pass.gate_out_at);
};

const insertAttendance = async (studentId, date, markedAt) => {
    const { data, error } = await supabase
        .from('attendance')
        .insert({ student_id: studentId, attendance_date: date, marked_at: markedAt })
        .select()
        .single();
    if (error) {
        if (error.code === '23505') throw fail(409, 'Attendance is already marked for today');
        throw error;
    }
    return data;
};

const getRecords = async ({ studentIds, from, to }) => {
    let query = supabase.from('attendance').select('student_id, attendance_date, marked_at');
    if (studentIds) query = query.in('student_id', studentIds);
    if (from) query = query.gte('attendance_date', from);
    if (to) query = query.lte('attendance_date', to);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

/** Approved student accounts with identity + room, for the warden roster. */
const getApprovedStudents = async () => {
    const { data: role, error: roleError } = await supabase
        .from('roles').select('id').ilike('name', 'student').maybeSingle();
    if (roleError) throw roleError;
    if (!role) return [];

    const { data: roles, error: rolesError } = await supabase
        .from('user_roles').select('user_id').eq('role_id', role.id).eq('approval_status', 'approved');
    if (rolesError) throw rolesError;
    const userIds = (roles || []).map((r) => r.user_id);
    if (!userIds.length) return [];

    const [{ data: users, error: usersError }, { data: students, error: studentsError }] = await Promise.all([
        supabase.from('users').select('id, name, email, phone').in('id', userIds),
        supabase.from('students')
            .select('id, user_id, roll_number, course, branch, academic_year, room_no, block_no, created_at')
            .in('user_id', userIds)
    ]);
    if (usersError) throw usersError;
    if (studentsError) throw studentsError;

    const userById = new Map((users || []).map((u) => [String(u.id), u]));
    return (students || []).map((s) => {
        const u = userById.get(String(s.user_id)) || {};
        return {
            student_id: s.id,
            user_id: s.user_id,
            name: u.name || null,
            email: u.email || null,
            phone: u.phone || null,
            roll_number: s.roll_number,
            course: s.course,
            branch: s.branch,
            academic_year: s.academic_year,
            room_number: s.room_no,
            block_number: s.block_no,
            created_at: s.created_at
        };
    });
};

module.exports = {
    fail,
    getStudentByUserId,
    getGatePasses,
    insertAttendance,
    getRecords,
    getApprovedStudents
};
