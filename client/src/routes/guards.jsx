import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../config/app.config';
import { PageLoader } from '../components/ui';

/** Only signed-in users with one of `roles` may enter. Others are redirected. */
export function RoleRoute({ roles }) {
  const { user, booting } = useAuth();
  const location = useLocation();
  if (booting) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) return <Navigate to="/forbidden" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Signed-in users are sent to their workspace instead of seeing auth screens. */
export function GuestRoute() {
  const { user, booting } = useAuth();
  if (booting) return <PageLoader />;
  if (user) return <Navigate to={ROLE_HOME[user.role] || '/forbidden'} replace />;
  return <Outlet />;
}

export function HomeRedirect() {
  const { user, booting } = useAuth();
  if (booting) return <PageLoader />;
  return <Navigate to={user ? ROLE_HOME[user.role] || '/forbidden' : '/login'} replace />;
}
