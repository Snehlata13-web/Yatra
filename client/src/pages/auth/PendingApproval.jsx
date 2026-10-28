import { Link, useLocation } from 'react-router-dom';
import { Hourglass, UserPlus, ShieldCheck, LogIn, ArrowLeft, XCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Notice } from '../../components/ui';
import { ROLE_LABEL } from '../../config/app.config';

export default function PendingApproval() {
  const { state } = useLocation();
  const role = state?.role;
  const rejected = Boolean(state?.rejected);
  const reviewer = role === 'student' ? 'hostel warden' : role ? 'administrator' : 'warden or administrator';

  const steps = [
    { icon: UserPlus, title: 'Account requested', text: state?.email ? `Registered as ${state.email}` : 'Your registration is recorded.', done: true },
    {
      icon: rejected ? XCircle : ShieldCheck,
      title: rejected ? 'Registration rejected' : `${reviewer[0].toUpperCase()}${reviewer.slice(1)} review`,
      text: rejected
        ? 'Your request was not approved.'
        : role === 'student'
          ? 'The warden checks your roll number, course and room details.'
          : role
            ? 'The administrator verifies staff accounts before they can access the gate or hostel records.'
            : 'Students are approved by the warden; Warden and Guard accounts by the administrator.',
      current: !rejected,
      failed: rejected,
    },
    { icon: LogIn, title: 'Sign in', text: 'Once approved, sign in with the same email and password.' },
  ];

  return (
    <AuthLayout>
      <div className="pending">
        <div className={`pending__art ${rejected ? 'pending__art--rejected' : ''}`} aria-hidden>
          {!rejected && <span className="pending__pulse" />}
          {rejected ? <XCircle size={30} /> : <Hourglass size={30} />}
        </div>
        <p className="eyebrow">{rejected ? 'Not approved' : state?.justRegistered ? 'Request received' : 'Awaiting approval'}</p>
        <h2>{rejected ? 'Your registration was rejected' : 'Your account is pending approval'}</h2>
        <p className="muted">
          {rejected
            ? 'Please contact the hostel office if you think this is a mistake.'
            : `${role ? `${ROLE_LABEL[role]} accounts` : 'New accounts'} need approval from the ${reviewer} before the workspace can be opened. This protects hostel records and gate access.`}
        </p>
        {state?.message && !state?.justRegistered && <Notice tone={rejected ? 'error' : 'warning'}>{state.message}</Notice>}

        <ol className="pending__steps">
          {steps.map(({ icon: Icon, title, text, done, current, failed }) => (
            <li key={title} className={done ? 'is-done' : failed ? 'is-failed' : current ? 'is-current' : ''}>
              <span className="pending__step-icon"><Icon size={17} aria-hidden /></span>
              <span>
                <strong>{title}</strong>
                <small>{text}</small>
              </span>
            </li>
          ))}
        </ol>

        <Link to="/login" className="btn btn--secondary btn--lg btn--block">
          <ArrowLeft size={18} aria-hidden /> <span>Back to sign in</span>
        </Link>
      </div>
    </AuthLayout>
  );
}
