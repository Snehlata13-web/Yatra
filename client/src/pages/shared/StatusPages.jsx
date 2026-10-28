import { Link, useLocation } from 'react-router-dom';
import { Compass, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME, ROLE_LABEL } from '../../config/app.config';
import { Logo } from '../../components/layout/Logo';

function StatusPage({ code, icon: Icon, title, message }) {
  const { user } = useAuth();
  const home = user ? ROLE_HOME[user.role] : '/login';
  return (
    <div className="status-page">
      <div className="status-page__card page-enter">
        <Logo tone="dark" />
        <div className="status-page__code" aria-hidden>{code}</div>
        <span className="status-page__icon" aria-hidden><Icon size={26} /></span>
        <h1>{title}</h1>
        <p className="muted">{message}</p>
        <Link to={home} className="btn btn--primary btn--lg">
          <ArrowLeft size={18} aria-hidden /> <span>{user ? `Back to ${ROLE_LABEL[user.role]} workspace` : 'Go to sign in'}</span>
        </Link>
      </div>
    </div>
  );
}

export function NotFound() {
  return <StatusPage code="404" icon={Compass} title="This page took a different route" message="The page you’re looking for doesn’t exist or was moved." />;
}

export function Forbidden() {
  const { state } = useLocation();
  return (
    <StatusPage
      code="403"
      icon={Lock}
      title="This area belongs to another role"
      message={`Your account can’t open ${state?.from ? `“${state.from}”` : 'this page'}. Each workspace is limited to its own role.`}
    />
  );
}
