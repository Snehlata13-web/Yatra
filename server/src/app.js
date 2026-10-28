require('dotenv').config();
require('./config/newrelic.js');
const express = require('express');
const userRoutes = require('./modules/users/user.routes.js');
const authRoutes = require('./modules/auth/auth.routes.js');
const adminRoutes = require('./modules/admins/admin.routes.js');
const studentRoutes = require('./modules/students/student.routes.js');
const passRoutes = require('./modules/passes/pass.routes.js');
const complaintRoutes = require('./modules/complaints/complaint.routes.js');
const guardRoutes = require('./modules/guards/guard.routes.js');
const wardenRoutes = require('./modules/wardens/warden.routes.js');
const approvalRoutes = require('./modules/approvals/approval.routes.js');
const foodRoutes = require('./modules/food/food.routes.js');
const noticeRoutes = require('./modules/notices/notice.routes.js');
const attendanceRoutes = require('./modules/attendance/attendance.routes.js');
const { apiRateLimiter } = require('./middleware/rate-limit.middleware.js');
const cors = require('cors'); 
const { logger } = require('./utils/logger.js');
const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 3000;

const allowedOrigins = (
  process.env.FRONTEND_ORIGIN ||
  'https://yatra-frontend-a0zb.onrender.com,http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

app.use(express.json());
app.use('/api/v1', apiRateLimiter);
app.use('/api/v1/users', userRoutes.router);
app.use('/api/v1/auth', authRoutes.router);
app.use('/api/v1/admin', adminRoutes.router);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/passes', passRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/guards', guardRoutes);
app.use('/api/v1/wardens', wardenRoutes);
app.use('/api/v1/approvals', approvalRoutes);
app.use('/api/v1/food', foodRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);


app.listen(port, () => {
  logger.info('Server is running', { port });
});
