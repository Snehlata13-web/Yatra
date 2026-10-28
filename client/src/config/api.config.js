/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  YATRA · BACKEND CONFIGURATION                                   ║
 * ║  This is the ONLY file you need to edit to point at your server. ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Local:      BASE_URL = 'http://localhost:3000/api/v1'
 * Deployed:   BASE_URL = 'https://yatra-backend-as6l.onrender.com/api/v1'
 *
 * Tip: you can also set VITE_API_BASE_URL in a .env file instead of editing this line.
 * Remember to add your frontend's URL to the backend's FRONTEND_ORIGIN env (CORS).
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://yatra-backend-as6l.onrender.com/api/v1',

  /**
   * Request timeout in milliseconds. Render's free tier "sleeps" and can take
   * ~50 s to wake up on the first request, so this is kept generous.
   */
  TIMEOUT_MS: 70000,

  /**
   * Where the JWT is kept: 'session' (cleared when the tab closes) or 'local'.
   * The token is never rendered on screen.
   */
  TOKEN_STORAGE: 'session',
  TOKEN_KEY: 'yatra.auth',

  /** Backend login messages for accounts that are not approved yet / were rejected. */
  PENDING_ACCOUNT_MESSAGE: /waiting for (admin )?approval/i,
  REJECTED_ACCOUNT_MESSAGE: /registration was rejected/i,

  /** Fields of the users table a signed-in user may change (PUT /users/:id). */
  PROFILE_EDITABLE_FIELDS: ['name', 'phone'],

  /** Fields of the students table a student may change (PUT /students/me). Collected at registration. */
  STUDENT_EDITABLE_FIELDS: [],

  /** Course options sent as `course` when a student registers. */
  COURSE_OPTIONS: [
    { value: 'BTech', label: 'B.Tech' },
    { value: 'MTech', label: 'M.Tech' },
    { value: 'MCA', label: 'MCA' },
  ],

  /**
   * Student fields sent with POST /auth/register (role = student).
   * Keys = UI field, values = exact key the backend validates.
   */
  STUDENT_REGISTER_FIELDS: {
    admissionNumber: 'admission_number',
    rollNumber: 'roll_number',
    collegeEmail: 'college_email',
    course: 'course',
    branch: 'branch',
    academicYear: 'academic_year',
    batch: 'batch',
    roomNumber: 'room_number',
    blockNumber: 'block_no',
  },

  /** Extra fields required when a Warden / Guard registers (UI key → backend key). */
  WARDEN_REGISTER_FIELDS: { employeeId: 'employee_id', phoneNumber: 'phone_number', hostelBlock: 'hostel_block' },
  GUARD_REGISTER_FIELDS: { employeeId: 'employee_id', gateNumber: 'gate_number' },

  /** Notice attachments (must match the backend's limits). */
  NOTICE_MEDIA: {
    MAX_FILES: 5,
    MAX_IMAGE_MB: 10,
    MAX_VIDEO_MB: 50,
    TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'],
  },

  /** Backend has no photo upload for complaints. */
  COMPLAINT_PHOTO_UPLOAD: false,

  /** Exact status strings stored by the backend for complaints. */
  COMPLAINT_STATUS_VALUES: {
    pending: 'Pending',
    in_progress: 'In Progress',
    awaiting_confirmation: 'Awaiting Confirmation',
    resolved: 'Resolved',
    reopened: 'Reopened',
  },

  /** Exact role strings used by the backend. */
  ROLE_VALUES: {
    student: 'student',
    warden: 'warden',
    guard: 'guard',
    admin: 'admin',
  },
};

/**
 * Every REST route the app calls. `path` may be a string or a function receiving the record id.
 * Paths are relative to BASE_URL.
 */
export const ENDPOINTS = {
  auth: {
    login: { method: 'POST', path: '/auth/login' },          // → { data: { user, token } }
    register: { method: 'POST', path: '/auth/register' },    // { name, email, password, role, phone? }
  },

  users: {
    get: { method: 'GET', path: (id) => `/users/${id}` },    // own record (id comes from the JWT)
    update: { method: 'PUT', path: (id) => `/users/${id}` }, // { name?, email?, phone? }
  },

  students: {
    me: { method: 'GET', path: '/students/me' },             // room_number, block_number, roll_number…
    updateMe: { method: 'PUT', path: '/students/me' },
    update: { method: 'PUT', path: (studentId) => `/students/${studentId}` },   // warden/admin · students.id
  },

  passes: {
    create: { method: 'POST', path: '/passes' },             // { destination, reason, departure_time, return_time }
    list: { method: 'GET', path: '/passes' },                // student → own passes, warden → all passes
  },

  approvals: {
    decide: { method: 'PATCH', path: (passId) => `/approvals/${passId}` }, // warden { decision: approved|rejected }
  },

  guards: {
    passes: { method: 'GET', path: '/guards/passes' },       // approved passes + guard_verified + student details
    pass: { method: 'GET', path: (id) => `/guards/${id}` },  // one pass with student details (search by pass ID)
    approved: { method: 'GET', path: '/guards/approved' },   // guard-stage approvals already verified (ids only)
    verify: { method: 'PUT', path: (id) => `/guards/approve/${id}` },
    gate: { method: 'PATCH', path: (id) => `/guards/${id}/gate` }, // { action: OUT|IN }
  },

  wardens: {
    pendingStudents: { method: 'GET', path: '/wardens/students/pending' },
    students: { method: 'GET', path: '/wardens/students' },                       // all student accounts + approval
    deleteStudent: { method: 'DELETE', path: (userId) => `/wardens/students/${userId}` },
    decideStudent: { method: 'PATCH', path: (userId) => `/wardens/students/${userId}/approval` }, // { approval_status }
  },

  complaints: {
    create: { method: 'POST', path: '/complaints' },         // { category, problem_title, problem_description }
    mine: { method: 'GET', path: '/complaints/me' },
    confirm: { method: 'PATCH', path: (id) => `/complaints/${id}/confirm` },
    reopen: { method: 'PATCH', path: (id) => `/complaints/${id}/reopen` },
    all: { method: 'GET', path: '/complaints' },             // warden (no student identity)
    updateStatus: { method: 'PATCH', path: (id) => `/complaints/${id}/status` }, // { status }
  },

  food: {
    mine: { method: 'GET', path: '/food/reviews/me' },       // student · ?date=&meal_type=
    all: { method: 'GET', path: '/food/reviews' },           // warden/admin · ?date=&meal_type=
    create: { method: 'POST', path: '/food/reviews' },       // { meal_type, review, review_date }
    update: { method: 'PUT', path: (id) => `/food/reviews/${id}` },
  },

  notices: {
    list: { method: 'GET', path: '/notices' },               // student + warden
    detail: { method: 'GET', path: (id) => `/notices/${id}` },
    signUpload: { method: 'POST', path: '/notices/uploads/sign' }, // warden { file_name, content_type, file_size }
    create: { method: 'POST', path: '/notices' },            // warden { title, body, media: [{ path, content_type }] }
    update: { method: 'PUT', path: (id) => `/notices/${id}` },   // warden · same body as create (full replace)
    remove: { method: 'DELETE', path: (id) => `/notices/${id}` }, // warden
  },

  attendance: {
    mark: { method: 'POST', path: '/attendance/mark' },     // student · only inside the window & not OUT
    mine: { method: 'GET', path: '/attendance/me' },        // student · ?days=30
    day: { method: 'GET', path: '/attendance' },            // warden/admin · ?date=YYYY-MM-DD
  },

  admin: {
    pendingAccounts: { method: 'GET', path: '/admin/users/pending' },  // pending Warden/Guard accounts
    setApproval: { method: 'PATCH', path: (userId) => `/admin/users/${userId}/approval` }, // { approval_status }
  },
};
