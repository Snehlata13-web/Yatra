/**
 * Service layer — one function per backend capability.
 * Builds request bodies in the exact shape the Yatra server validates,
 * and maps responses to the UI models in normalize.js.
 */
import { request } from './client';
import { tokenStore } from './tokenStore';
import { API_CONFIG } from '../config/api.config';
import {
  normalizeUser, normalizePass, normalizeComplaint, normalizeFoodReview, normalizeNotice,
  normalizePendingStudent, normalizeStudentAccount, normalizeAccount, normalizePassStudent, normalizeStudentProfile, decodeToken, pickList, pickOne, unwrap,
} from './normalize';

const byNewest = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
const list = (res, mapper, ...keys) => pickList(res, ...keys).map(mapper).sort(byNewest);
const cleanPhone = (p) => String(p || '').replace(/[\s()-]/g, '');

/** Claims inside the current JWT: { id, email, role, approvalStatus, exp } */
export const sessionClaims = () => {
  const t = tokenStore.get();
  const claims = t ? decodeToken(t) : null;
  if (!claims) return null;
  if (claims.exp && claims.exp * 1000 < Date.now()) return null;
  return claims;
};

const loadStudentProfile = async () => {
  try {
    return normalizeStudentProfile(unwrap(await request('students', 'me')));
  } catch (err) {
    if (err.status === 404) return null; // student row not created yet
    throw err;
  }
};

/** Builds the full signed-in user from the JWT + GET /users/:id (+ GET /students/me). */
const loadCurrentUser = async (claims, fallbackUser) => {
  let base = fallbackUser;
  try {
    base = normalizeUser(unwrap(await request('users', 'get', { id: claims.id })));
  } catch (err) {
    if (!fallbackUser) throw err;
  }
  const user = { ...(fallbackUser || {}), ...base, id: claims.id, role: claims.role, approvalStatus: claims.approvalStatus || 'approved' };
  if (user.email === '' && claims.email) user.email = claims.email;
  if (claims.role === 'student') {
    const sp = await loadStudentProfile().catch(() => null);
    user.studentProfile = sp || {};
    user.studentProfileMissing = !sp;
  }
  return user;
};

export const authApi = {
  login: async (email, password) => {
    const res = unwrap(await request('auth', 'login', { body: { email, password } }));
    const token = res?.token;
    if (!token) throw new Error('Sign-in succeeded but the server did not return a session token.');
    tokenStore.set(token);
    try {
      const claims = decodeToken(token) || {};
      const user = await loadCurrentUser(claims, normalizeUser(res.user));
      return { token, user };
    } catch (err) {
      tokenStore.clear();
      throw err;
    }
  },

  register: ({ name, email, password, phone, role, student, staff }) => {
    const body = { name, email, password, role: API_CONFIG.ROLE_VALUES[role] };
    if (cleanPhone(phone)) body.phone = cleanPhone(phone);
    const staffMap = role === 'warden' ? API_CONFIG.WARDEN_REGISTER_FIELDS : role === 'guard' ? API_CONFIG.GUARD_REGISTER_FIELDS : null;
    if (staffMap && staff) {
      Object.entries(staffMap).forEach(([uiKey, apiKey]) => {
        const v = String(staff[uiKey] ?? '').trim();
        body[apiKey] = uiKey === 'phoneNumber' ? cleanPhone(v) : v;
      });
    }
    if (role === 'student' && student) {
      Object.entries(API_CONFIG.STUDENT_REGISTER_FIELDS).forEach(([uiKey, apiKey]) => {
        const v = student[uiKey];
        body[apiKey] = uiKey === 'academicYear' ? Number(v) : String(v ?? '').trim();
      });
      if (body.college_email) body.college_email = body.college_email.toLowerCase();
    }
    return request('auth', 'register', { body });
  },

  /** Restores the session on page load. */
  me: async () => {
    const claims = sessionClaims();
    if (!claims) throw new Error('No active session');
    return loadCurrentUser(claims);
  },
};

export const profileApi = {
  update: async (userId, fields) => {
    const body = {};
    if (fields.name !== undefined) body.name = fields.name;
    if (fields.phone !== undefined) body.phone = cleanPhone(fields.phone) || null;
    return normalizeUser(unwrap(await request('users', 'update', { id: userId, body })));
  },
  updateStudent: async (fields) => normalizeStudentProfile(unwrap(await request('students', 'updateMe', { body: fields }))),
};

export const passApi = {
  create: ({ destination, reason, departureTime, returnTime }) =>
    request('passes', 'create', { body: { destination, reason, departure_time: departureTime, return_time: returnTime } }),
  mine: async () => list(await request('passes', 'list'), normalizePass),
  all: async () => list(await request('passes', 'list'), normalizePass),
  approve: (id) => request('approvals', 'decide', { id, body: { decision: 'approved' } }),
  reject: (id) => request('approvals', 'decide', { id, body: { decision: 'rejected' } }),

  /** Guard queue: warden-approved passes with guard_verified + student details, in one call. */
  guardList: async () =>
    pickList(await request('guards', 'passes'))
      .map((raw) => ({ ...normalizePass(raw), guardVerified: Boolean(raw.guard_verified ?? raw.guard_decision === 'approved') }))
      .sort((x, y) => new Date(x.departureTime || 0) - new Date(y.departureTime || 0)),
  /**
   * Gate desk lookup by pass ID: pass + student details, plus whether this guard desk
   * already verified it (from the guard-stage approvals). Returns null if no such pass.
   */
  guardLookup: async (id) => {
    const cleanId = String(id).trim().replace(/^#/, '');
    let raw;
    try {
      raw = unwrap(await request('guards', 'pass', { id: cleanId }));
    } catch (err) {
      if (err.status === 404 || err.status === 400 || /single json object|not found|invalid input syntax/i.test(err.message)) return null;
      throw err;
    }
    if (!raw || raw.id === undefined) return null;
    const approved = pickList(await request('guards', 'approved'));
    const verified = approved.some((a) => String(a.pass_id) === String(raw.id));
    return { ...normalizePass(raw), guardVerified: verified };
  },
  verify: (id) => request('guards', 'verify', { id }),
  markOut: async (id) => unwrap(await request('guards', 'gate', { id, body: { action: 'OUT' } })),
  markIn: async (id) => unwrap(await request('guards', 'gate', { id, body: { action: 'IN' } })),
};

export const complaintApi = {
  create: ({ category, title, description }) =>
    request('complaints', 'create', { body: { category, problem_title: title, problem_description: description } }),
  mine: async () => list(await request('complaints', 'mine'), normalizeComplaint),
  all: async () => list(await request('complaints', 'all'), normalizeComplaint),
  confirm: (id) => request('complaints', 'confirm', { id }),
  reopen: (id) => request('complaints', 'reopen', { id }),
  updateStatus: (id, status) =>
    request('complaints', 'updateStatus', { id, body: { status: API_CONFIG.COMPLAINT_STATUS_VALUES[status] } }),
};

const foodQuery = ({ date, meal } = {}) => ({ date: date || undefined, meal_type: meal || undefined });

export const foodApi = {
  mine: async (filters) => pickList(await request('food', 'mine', { query: foodQuery(filters) })).map(normalizeFoodReview),
  all: async (filters) => pickList(await request('food', 'all', { query: foodQuery(filters) })).map(normalizeFoodReview),
  create: ({ meal, date, review }) =>
    request('food', 'create', { body: { meal_type: meal, review, review_date: date } }),
  update: (id, { meal, date, review }) =>
    request('food', 'update', { id, body: { meal_type: meal, review, review_date: date } }),
};

/** Uploads one file to the signed Supabase Storage URL returned by the backend. */
const uploadToSignedUrl = async (url, file) => {
  const form = new FormData();
  form.append('cacheControl', '3600');
  form.append('', file);
  const res = await fetch(url, { method: 'PUT', body: form, headers: { 'x-upsert': 'false' } });
  if (!res.ok) throw new Error(`Upload of “${file.name}” failed (${res.status}).`);
};

export const noticeApi = {
  list: async () => list(await request('notices', 'list'), normalizeNotice),
  detail: async (id) => normalizeNotice(pickOne(await request('notices', 'detail', { id }))),
  /** files: File[] — each is signed, uploaded, then referenced in the notice. */
  create: async ({ title, body, files = [] }, onProgress) => {
    const media = await uploadNoticeFiles(files, onProgress);
    return normalizeNotice(unwrap(await request('notices', 'create', { body: { title, body, media } })));
  },
  /** keep: existing media items ({ path, type }) to retain · files: new File[] to add. */
  update: async (id, { title, body, keep = [], files = [] }, onProgress) => {
    const uploaded = await uploadNoticeFiles(files, onProgress);
    const media = [...keep.filter((m) => m.path).map((m) => ({ path: m.path, content_type: m.type })), ...uploaded];
    return normalizeNotice(unwrap(await request('notices', 'update', { id, body: { title, body, media } })));
  },
  remove: (id) => request('notices', 'remove', { id }),
};

const uploadNoticeFiles = async (files, onProgress) => {
    const media = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      onProgress?.({ index: i, total: files.length, name: file.name });
      const signed = unwrap(await request('notices', 'signUpload', {
        body: { file_name: file.name, content_type: file.type, file_size: file.size },
      }));
      await uploadToSignedUrl(signed.upload_url, file);
      media.push({ path: signed.path, content_type: file.type });
    }
    return media;
};

const STUDENT_KEYS = API_CONFIG.STUDENT_REGISTER_FIELDS;

export const wardenApi = {
  students: async () => pickList(await request('wardens', 'students')).map(normalizeStudentAccount),
  /** Warden adds a student: register, then approve straight away. */
  addStudent: async ({ name, email, password, phone, student }) => {
    const created = unwrap(await authApi.register({ name, email, password, phone, role: 'student', student }));
    const userId = created?.id ?? created?.user?.id;
    if (userId !== undefined) {
      await request('wardens', 'decideStudent', { id: userId, body: { approval_status: 'approved' } });
    }
    return created;
  },
  /** account: the normalized student account · changes: { user: {...}, student: {...} } (UI keys, changed only). */
  updateStudent: async (account, { user = {}, student = {} }) => {
    if (Object.keys(user).length) {
      const body = {};
      if (user.name !== undefined) body.name = user.name;
      if (user.email !== undefined) body.email = user.email;
      if (user.phone !== undefined) body.phone = cleanPhone(user.phone) || null;
      await request('users', 'update', { id: account.id, body });
    }
    if (Object.keys(student).length) {
      if (account.studentId === undefined || account.studentId === null) throw new Error('This account has no student record to update.');
      const body = Object.fromEntries(Object.entries(student).map(([k, v]) => [
        STUDENT_KEYS[k], k === 'academicYear' ? Number(v) : k === 'collegeEmail' ? String(v).trim().toLowerCase() : String(v).trim(),
      ]));
      await request('students', 'update', { id: account.studentId, body });
    }
  },
  deleteStudent: (userId) => request('wardens', 'deleteStudent', { id: userId }),
  pendingStudents: async () => pickList(await request('wardens', 'pendingStudents')).map(normalizePendingStudent),
  approveStudent: (userId) => request('wardens', 'decideStudent', { id: userId, body: { approval_status: 'approved' } }),
  rejectStudent: (userId) => request('wardens', 'decideStudent', { id: userId, body: { approval_status: 'rejected' } }),
};

const normalizeAttendanceRow = (r) => ({
  studentId: r.student_id,
  userId: r.user_id,
  status: r.status,
  markedAt: r.marked_at,
  pass: r.pass,
  student: normalizePassStudent(r) || {},
});

export const attendanceApi = {
  mark: async () => unwrap(await request('attendance', 'mark')),
  mine: async (days = 30) => unwrap(await request('attendance', 'mine', { query: { days } })),
  day: async (date) => {
    const data = unwrap(await request('attendance', 'day', { query: { date } }));
    return { ...data, students: (data.students || []).map(normalizeAttendanceRow) };
  },
};

export const adminApi = {
  pending: async () =>
    pickList(await request('admin', 'pendingAccounts'))
      .map(normalizeAccount)
      .filter((a) => a.role === 'warden' || a.role === 'guard'),
  approve: (id) => request('admin', 'setApproval', { id, body: { approval_status: 'approved' } }),
  reject: (id) => request('admin', 'setApproval', { id, body: { approval_status: 'rejected' } }),
};
