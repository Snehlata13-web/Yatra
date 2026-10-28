import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { RoleRoute, GuestRoute, HomeRedirect } from './routes/guards';
import { AppShell } from './components/layout/AppShell';
import { ROLES } from './config/app.config';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PendingApproval from './pages/auth/PendingApproval';

import StudentOverview from './pages/student/Overview';
import MyPasses from './pages/student/MyPasses';
import RequestPass from './pages/student/RequestPass';
import StudentComplaints from './pages/student/Complaints';
import FoodReviews from './pages/student/FoodReviews';

import WardenOverview from './pages/warden/Overview';
import PassApprovals from './pages/warden/PassApprovals';
import WardenComplaints from './pages/warden/Complaints';
import StudentApprovals from './pages/warden/StudentApprovals';
import WardenFoodReviews from './pages/warden/FoodReviews';
import Notices from './pages/shared/Notices';

import GateDesk from './pages/guard/GateDesk';
import VerifiedPasses from './pages/guard/VerifiedPasses';

import AccountApprovals from './pages/admin/AccountApprovals';
import AdminOverview from './pages/admin/Overview';
import StudentAttendance from './pages/student/Attendance';
import WardenAttendance from './pages/warden/Attendance';

import Profile from './pages/shared/Profile';
import Guide from './pages/shared/Guide';
import { NotFound, Forbidden } from './pages/shared/StatusPages';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />

            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/guide" element={<Guide />} />

            <Route element={<RoleRoute roles={[ROLES.STUDENT]} />}>
              <Route path="/student" element={<AppShell />}>
                <Route index element={<StudentOverview />} />
                <Route path="passes" element={<MyPasses />} />
                <Route path="passes/new" element={<RequestPass />} />
                <Route path="complaints" element={<StudentComplaints />} />
                <Route path="attendance" element={<StudentAttendance />} />
                <Route path="food" element={<FoodReviews />} />
                <Route path="notices" element={<Notices />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

            <Route element={<RoleRoute roles={[ROLES.WARDEN]} />}>
              <Route path="/warden" element={<AppShell />}>
                <Route index element={<WardenOverview />} />
                <Route path="passes" element={<PassApprovals />} />
                <Route path="students" element={<StudentApprovals />} />
                <Route path="attendance" element={<WardenAttendance />} />
                <Route path="complaints" element={<WardenComplaints />} />
                <Route path="food" element={<WardenFoodReviews />} />
                <Route path="notices" element={<Notices />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

            <Route element={<RoleRoute roles={[ROLES.GUARD]} />}>
              <Route path="/guard" element={<AppShell />}>
                <Route index element={<GateDesk />} />
                <Route path="verified" element={<VerifiedPasses />} />
              </Route>
            </Route>

            <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
              <Route path="/admin" element={<AppShell />}>
                <Route index element={<AdminOverview />} />
                <Route path="accounts" element={<AccountApprovals />} />
                <Route path="students" element={<StudentApprovals />} />
                <Route path="attendance" element={<WardenAttendance />} />
                <Route path="passes" element={<PassApprovals />} />
                <Route path="complaints" element={<WardenComplaints />} />
                <Route path="food" element={<WardenFoodReviews />} />
                <Route path="notices" element={<Notices />} />
              </Route>
            </Route>

            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
