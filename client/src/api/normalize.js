/**
 * Response normalizers. They accept snake_case or camelCase and common wrapper shapes,
 * so the UI always works with one consistent model.
 */
import { API_CONFIG } from '../config/api.config';

const first = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
};

const token = (v) => String(v ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');

/** Unwrap `{ data: ... }`, `{ success, data }`, etc. */
export const unwrap = (res) => {
  if (res && typeof res === 'object' && !Array.isArray(res) && 'data' in res && res.data !== undefined) {
    return res.data;
  }
  return res;
};

/** Find the list inside a response: [...] | { data: [...] } | { items | results | <key>: [...] } */
export const pickList = (res, ...keys) => {
  const body = unwrap(res);
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    for (const k of [...keys, 'items', 'results', 'records', 'rows']) {
      if (Array.isArray(body[k])) return body[k];
    }
    const anyArray = Object.values(body).find(Array.isArray);
    if (anyArray) return anyArray;
  }
  return [];
};

export const pickOne = (res, ...keys) => {
  const body = unwrap(res);
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    for (const k of keys) if (body[k] && typeof body[k] === 'object') return body[k];
  }
  return body;
};

const toRole = (raw) => {
  const r = token(raw);
  const entry = Object.entries(API_CONFIG.ROLE_VALUES).find(([, v]) => token(v) === r);
  return entry ? entry[0] : r;
};

const toApproval = (raw, role) => {
  if (raw === true) return 'approved';
  if (raw === false) return 'pending';
  const v = token(raw);
  if (!v) return role === 'student' || role === 'admin' ? 'approved' : 'pending';
  return v;
};

export const normalizeUser = (raw) => {
  if (!raw) return null;
  const sp = first(raw, 'student_profile', 'studentProfile', 'profile') || {};
  const role = toRole(first(raw, 'role', 'user_role', 'userRole'));
  return {
    id: first(raw, 'id', '_id', 'user_id', 'userId'),
    name: first(raw, 'name', 'full_name', 'fullName') || '',
    email: first(raw, 'email') || '',
    phone: first(raw, 'phone', 'phone_number', 'phoneNumber', 'mobile') || '',
    role,
    approvalStatus: toApproval(first(raw, 'approval_status', 'approvalStatus', 'status', 'is_approved', 'isApproved'), role),
    studentProfile: {
      rollNumber: first(sp, 'roll_number', 'rollNumber', 'roll_no') ?? first(raw, 'roll_number', 'rollNumber'),
      roomNumber: first(sp, 'room_number', 'roomNumber', 'room_no', 'room') ?? first(raw, 'room_number', 'roomNumber'),
      blockNumber: first(sp, 'block_number', 'blockNumber', 'block') ?? first(raw, 'block_number', 'blockNumber'),
      course: first(sp, 'course', 'branch', 'department'),
      year: first(sp, 'year', 'semester'),
    },
    createdAt: first(raw, 'created_at', 'createdAt'),
  };
};

const toPassStatus = (raw) => {
  const v = token(raw);
  if (['approved', 'accept', 'accepted'].includes(v)) return 'approved';
  if (['rejected', 'declined', 'denied'].includes(v)) return 'rejected';
  return 'pending';
};

const toStage = (raw) => {
  const v = String(raw ?? '').trim().toUpperCase();
  if (v === 'OUT') return 'OUT';
  if (v === 'IN') return 'IN';
  return null;
};

/** Student identity attached to passes for wardens/guards (`pass.student`). */
export const normalizePassStudent = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  return {
    name: first(raw, 'name', 'full_name') || '',
    email: first(raw, 'email') || '',
    phone: first(raw, 'phone', 'phone_number') || '',
    rollNumber: first(raw, 'roll_number', 'rollNumber'),
    admissionNumber: first(raw, 'admission_number'),
    course: first(raw, 'course'),
    branch: first(raw, 'branch', 'department'),
    year: first(raw, 'academic_year', 'year'),
    batch: first(raw, 'batch'),
    roomNumber: first(raw, 'room_number', 'room_no'),
    blockNumber: first(raw, 'block_number', 'block_no'),
  };
};

export const normalizePass = (raw) => ({
  id: first(raw, 'id', '_id', 'pass_id', 'passId'),
  destination: first(raw, 'destination', 'place') || '',
  reason: first(raw, 'reason', 'purpose') || '',
  departureTime: first(raw, 'departure_time', 'departureTime', 'departure', 'out_time', 'from_date', 'start_time'),
  returnTime: first(raw, 'return_time', 'returnTime', 'expected_return', 'expectedReturn', 'in_time', 'to_date', 'end_time'),
  status: toPassStatus(first(raw, 'warden_status', 'wardenStatus', 'status', 'approval_status', 'approvalStatus')),
  guardVerified: (() => {
    const v = first(raw, 'guard_verified', 'guardVerified', 'is_verified', 'isVerified', 'verified');
    return v === undefined ? null : Boolean(v);
  })(),
  currentStage: toStage(first(raw, 'current_stage', 'currentStage', 'stage', 'gate_status')),
  createdAt: first(raw, 'created_at', 'createdAt', 'requested_at'),
  student: normalizePassStudent(first(raw, 'student', 'students')),
  guardApproverId: first(raw, 'guard_approver_id'),
  gateOutAt: first(raw, 'gate_out_at'),
  gateInAt: first(raw, 'gate_in_at'),
  guardVerifiedAt: first(raw, 'guard_verified_at'),
});

const toComplaintStatus = (raw) => {
  const v = token(raw);
  const entry = Object.entries(API_CONFIG.COMPLAINT_STATUS_VALUES).find(([, val]) => token(val) === v);
  if (entry) return entry[0];
  if (v === 'awaiting' || v === 'awaiting_student_confirmation') return 'awaiting_confirmation';
  if (v === 'inprogress') return 'in_progress';
  return v || 'pending';
};

export const normalizeComplaint = (raw) => ({
  id: first(raw, 'id', '_id', 'complaint_id', 'complaintId'),
  category: first(raw, 'category', 'type') || 'Other',
  title: first(raw, 'problem_title', 'title', 'problemTitle', 'subject') || '',
  description: first(raw, 'problem_description', 'description', 'problemDescription', 'details') || '',
  roomNumber: first(raw, 'room_number', 'room_no', 'roomNumber', 'room') ?? first(raw?.students, 'room_number', 'room_no'),
  blockNumber: first(raw, 'block_number', 'block_no', 'blockNumber', 'block') ?? first(raw?.students, 'block_number', 'block_no'),
  status: toComplaintStatus(first(raw, 'status')),
  photoUrl: first(raw, 'photo_url', 'photoUrl', 'image_url', 'imageUrl'),
  createdAt: first(raw, 'submitted_at', 'created_at', 'createdAt'),
  updatedAt: first(raw, 'resolved_at', 'completed_at', 'updated_at', 'updatedAt'),
});

/** Decode the JWT payload (no verification — the server verifies). */
export const decodeToken = (jwt) => {
  try {
    const part = String(jwt).split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
};

/** Student row from GET /students/me */
export const normalizeStudentProfile = (raw) => ({
  rollNumber: first(raw, 'roll_number', 'rollNumber'),
  roomNumber: first(raw, 'room_no', 'room_number', 'roomNumber'),
  blockNumber: first(raw, 'block_no', 'block_number', 'blockNumber'),
  branch: first(raw, 'branch'),
  courseName: first(raw, 'course'),
  course: [first(raw, 'course'), first(raw, 'branch')].filter(Boolean).join(' · ') || undefined,
  year: first(raw, 'academic_year', 'year'),
  batch: first(raw, 'batch'),
  admissionNumber: first(raw, 'admission_number'),
  collegeEmail: first(raw, 'college_email'),
});

export const normalizeFoodReview = (raw) => {
  const d = first(raw, 'review_date', 'date', 'reviewDate', 'meal_date');
  return {
    id: first(raw, 'id', '_id', 'review_id'),
    meal: token(first(raw, 'meal_type', 'meal', 'mealType')),
    date: d ? String(d).slice(0, 10) : '',
    review: first(raw, 'review', 'review_text', 'reviewText', 'comment', 'text') || '',
    createdAt: first(raw, 'created_at', 'createdAt'),
  };
};

export const normalizeNotice = (raw) => ({
  id: first(raw, 'id'),
  title: first(raw, 'title') || '',
  body: first(raw, 'body', 'description') || '',
  media: (first(raw, 'media') || []).map((m) => ({ url: m.url || m.signed_url, path: m.path, type: m.content_type || '' })).filter((m) => m.url),
  createdAt: first(raw, 'created_at', 'createdAt'),
  updatedAt: first(raw, 'updated_at'),
});

/** Any student account (GET /wardens/students). */
export const normalizeStudentAccount = (raw) => ({
  id: first(raw, 'id', 'user_id'),
  studentId: first(raw, 'student_id') ?? first(raw?.student, 'id'),
  name: first(raw, 'name') || '',
  email: first(raw, 'email') || '',
  phone: first(raw, 'phone') || '',
  approvalStatus: token(first(raw, 'approval_status')) || 'pending',
  student: normalizePassStudent(first(raw, 'student')) || {},
  collegeEmail: first(raw?.student, 'college_email'),
  createdAt: first(raw?.student, 'created_at'),
});

/** Pending student registration (GET /wardens/students/pending). */
export const normalizePendingStudent = (raw) => ({
  id: first(raw, 'id', 'user_id'),
  name: first(raw, 'name') || '',
  email: first(raw, 'email') || '',
  phone: first(raw, 'phone') || '',
  student: normalizePassStudent(first(raw, 'student')) || {},
  collegeEmail: first(raw?.student, 'college_email'),
});

export const normalizeAccount = (raw) => {
  const u = normalizeUser(raw);
  return { id: u.id, name: u.name, email: u.email, role: u.role, approvalStatus: u.approvalStatus };
};

export const extractAuth = (res) => {
  const body = unwrap(res) || {};
  const token = first(body, 'token', 'access_token', 'accessToken', 'jwt') ?? first(res, 'token', 'access_token', 'accessToken');
  const userRaw = first(body, 'user', 'account', 'profile') ?? first(res, 'user');
  return { token, user: userRaw ? normalizeUser(userRaw) : null };
};
