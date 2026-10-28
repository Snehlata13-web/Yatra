const model = require('./attendance.model.js');

/* ---------------- Time window (server clock, hostel time zone) ---------------- */
const TZ = process.env.ATTENDANCE_TIMEZONE || 'Asia/Kolkata';
const parseHM = (value, fallback) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
    if (!match) return fallback;
    return Number(match[1]) * 60 + Number(match[2]);
};
const START_MIN = parseHM(process.env.ATTENDANCE_START, 19 * 60);      // 19:00
const END_MIN = parseHM(process.env.ATTENDANCE_END, 20 * 60 + 30);     // 20:30

const zoneParts = (date) => Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).formatToParts(date).map((p) => [p.type, p.value])
);

/** YYYY-MM-DD in the hostel time zone. */
const localDate = (date = new Date()) => {
    const p = zoneParts(date);
    return `${p.year}-${p.month}-${p.day}`;
};

/** UTC instant for `minutes` after local midnight on `ymd` in the hostel time zone. */
const zonedInstant = (ymd, minutes) => {
    const [y, m, d] = ymd.split('-').map(Number);
    const guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
    const p = zoneParts(new Date(guess));
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return new Date(guess - (asUtc - guess));
};

const shiftDate = (ymd, days) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

const fmt = (minutes) => {
    const h = Math.floor(minutes / 60);
    const mm = String(minutes % 60).padStart(2, '0');
    return `${((h + 11) % 12) + 1}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
};

const windowFor = (ymd, now = new Date()) => {
    const opensAt = zonedInstant(ymd, START_MIN);
    const closesAt = zonedInstant(ymd, END_MIN);
    return {
        date: ymd,
        timezone: TZ,
        label: `${fmt(START_MIN)} – ${fmt(END_MIN)}`,
        opens_at: opensAt.toISOString(),
        closes_at: closesAt.toISOString(),
        is_open: now >= opensAt && now <= closesAt,
        has_closed: now > closesAt,
        server_time: now.toISOString()
    };
};

/* ---------------- Outside-campus detection from gate records ---------------- */
/** The pass that kept the student outside campus during that day's window, if any. */
const outsidePassFor = (passes, ymd, today) => {
    const win = windowFor(ymd);
    const start = new Date(win.opens_at);
    const end = new Date(win.closes_at);
    return passes.find((pass) => {
        if (pass.gate_out_at) {
            const out = new Date(pass.gate_out_at);
            const back = pass.gate_in_at ? new Date(pass.gate_in_at)
                : pass.current_stage === 'OUT' ? new Date(8.64e15) : null;
            if (!back) return false;
            return out < end && back > start;
        }
        // Older passes without gate times: only "currently OUT" is known, so apply it to today only.
        return ymd === today && pass.current_stage === 'OUT';
    }) || null;
};

const passSummary = (pass) => pass && ({
    id: pass.id,
    destination: pass.destination,
    gate_out_at: pass.gate_out_at || null,
    return_time: pass.return_time
});

/* present | outside | pending | absent | not_enrolled */
const statusFor = ({ record, outsidePass, ymd, today, win, enrolledFrom }) => {
    if (record) return 'present';
    if (outsidePass) return 'outside';
    if (enrolledFrom && ymd < enrolledFrom) return 'not_enrolled';
    if (ymd === today && !win.has_closed) return 'pending';
    return 'absent';
};

/* ---------------- Student ---------------- */
const getStudentOrThrow = async (userId) => {
    const student = await model.getStudentByUserId(userId);
    if (!student) throw model.fail(404, 'Student profile not found');
    return student;
};

const markAttendance = async (userId) => {
    const now = new Date();
    const today = localDate(now);
    const win = windowFor(today, now);
    if (!win.is_open) {
        throw model.fail(403, win.has_closed
            ? `Attendance for today closed at ${fmt(END_MIN)}`
            : `Attendance opens at ${fmt(START_MIN)} — you can mark it between ${win.label}`);
    }
    const student = await getStudentOrThrow(userId);
    const passes = await model.getGatePasses([student.id]);
    const outside = passes.find((pass) => pass.current_stage === 'OUT');
    if (outside) {
        throw model.fail(409, `You are marked OUT at the gate on pass #${outside.id}. Attendance is only for students inside the hostel.`);
    }
    const record = await model.insertAttendance(student.id, today, now.toISOString());
    return { ...record, status: 'present', window: win };
};

const getMyAttendance = async (userId, days = 30) => {
    const now = new Date();
    const today = localDate(now);
    const win = windowFor(today, now);
    const student = await getStudentOrThrow(userId);
    const enrolledFrom = student.created_at ? localDate(new Date(student.created_at)) : null;
    const from = shiftDate(today, -(Math.min(Math.max(days, 1), 120) - 1));

    const [records, passes] = await Promise.all([
        model.getRecords({ studentIds: [student.id], from, to: today }),
        model.getGatePasses([student.id])
    ]);
    const byDate = new Map(records.map((r) => [String(r.attendance_date).slice(0, 10), r]));

    const history = [];
    for (let ymd = today; ymd >= from; ymd = shiftDate(ymd, -1)) {
        const record = byDate.get(ymd);
        const outsidePass = outsidePassFor(passes, ymd, today);
        const status = statusFor({ record, outsidePass, ymd, today, win: windowFor(ymd, now), enrolledFrom });
        if (status === 'not_enrolled') break;
        history.push({ date: ymd, status, marked_at: record ? record.marked_at : null, pass: passSummary(outsidePass) });
    }

    const currentlyOut = passes.find((pass) => pass.current_stage === 'OUT') || null;
    const counted = history.filter((h) => h.status !== 'pending');
    return {
        window: win,
        today: history[0] || { date: today, status: 'pending', marked_at: null, pass: null },
        can_mark: win.is_open && !byDate.has(today) && !currentlyOut,
        currently_out: passSummary(currentlyOut),
        summary: {
            present: counted.filter((h) => h.status === 'present').length,
            absent: counted.filter((h) => h.status === 'absent').length,
            outside: counted.filter((h) => h.status === 'outside').length,
            days: counted.length
        },
        history
    };
};

/* ---------------- Warden / admin ---------------- */
const getAttendanceForDate = async (date) => {
    const now = new Date();
    const today = localDate(now);
    const ymd = date || today;
    if (ymd > today) throw model.fail(400, 'Attendance cannot be viewed for a future date');
    const win = windowFor(ymd, now);

    const students = await model.getApprovedStudents();
    const ids = students.map((s) => s.student_id);
    const [records, passes] = await Promise.all([
        ids.length ? model.getRecords({ studentIds: ids, from: ymd, to: ymd }) : [],
        model.getGatePasses(ids)
    ]);
    const recordByStudent = new Map(records.map((r) => [String(r.student_id), r]));
    const passesByStudent = new Map();
    passes.forEach((pass) => {
        const key = String(pass.student_id);
        passesByStudent.set(key, [...(passesByStudent.get(key) || []), pass]);
    });

    const rows = students
        .map(({ created_at, ...s }) => {
            const record = recordByStudent.get(String(s.student_id));
            const outsidePass = outsidePassFor(passesByStudent.get(String(s.student_id)) || [], ymd, today);
            const enrolledFrom = created_at ? localDate(new Date(created_at)) : null;
            const status = statusFor({ record, outsidePass, ymd, today, win, enrolledFrom });
            return { ...s, status, marked_at: record ? record.marked_at : null, pass: passSummary(outsidePass) };
        })
        .filter((row) => row.status !== 'not_enrolled');

    const count = (st) => rows.filter((r) => r.status === st).length;
    return {
        window: win,
        summary: {
            total: rows.length,
            present: count('present'),
            pending: count('pending'),
            absent: count('absent'),
            outside: count('outside')
        },
        students: rows
    };
};

module.exports = {
    markAttendance,
    getMyAttendance,
    getAttendanceForDate,
    // exported for tests
    windowFor,
    localDate,
    outsidePassFor
};
