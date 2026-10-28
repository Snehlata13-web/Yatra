const { supabase } = require('../config/db.js');

// Adds a `student` object (identity + academic + room details) to each pass.
// Uses plain lookups instead of embedded joins so it works without FK metadata.
const attachStudentDetails = async (passes) => {
    const list = Array.isArray(passes) ? passes : [passes];
    const studentIds = [...new Set(list.map((pass) => pass && pass.student_id).filter((id) => id !== null && id !== undefined))];
    if (!studentIds.length) return passes;

    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, user_id, roll_number, admission_number, branch, course, academic_year, batch, room_no, block_no')
        .in('id', studentIds);
    if (studentsError) throw studentsError;

    const userIds = [...new Set((students || []).map((student) => student.user_id))];
    let users = [];
    if (userIds.length) {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, phone')
            .in('id', userIds);
        if (error) throw error;
        users = data || [];
    }

    const userById = new Map(users.map((user) => [String(user.id), user]));
    const studentById = new Map((students || []).map((student) => {
        const user = userById.get(String(student.user_id)) || {};
        return [String(student.id), {
            name: user.name || null,
            email: user.email || null,
            phone: user.phone || null,
            roll_number: student.roll_number,
            admission_number: student.admission_number,
            course: student.course,
            branch: student.branch,
            academic_year: student.academic_year,
            batch: student.batch,
            room_number: student.room_no,
            block_number: student.block_no
        }];
    }));

    const withDetails = list.map((pass) => pass && ({
        ...pass,
        student: studentById.get(String(pass.student_id)) || null
    }));
    return Array.isArray(passes) ? withDetails : withDetails[0];
};

module.exports = { attachStudentDetails };