import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Info } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button, TextField, PasswordField, Notice } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { API_CONFIG } from '../../config/api.config';
import { ROLE_HOME } from '../../config/app.config';
import { validate, required, email as emailRule } from '../../utils/validate';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: location.state?.email || '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  // Wake the hosted backend (Render free tier sleeps) as soon as the page opens.
  useEffect(() => {
    fetch(`${new URL(API_CONFIG.BASE_URL).origin}/health`, { cache: 'no-store' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading) { setSlow(false); return undefined; }
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, [loading]);

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
    setServerError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(values, { email: [required('Email'), emailRule()], password: [required('Password')] });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setServerError('');
    try {
      const user = await signIn(values.email.trim(), values.password);
      const from = location.state?.from;
      navigate(from && from.startsWith(ROLE_HOME[user.role]) ? from : ROLE_HOME[user.role] || '/forbidden', { replace: true });
    } catch (err) {
      if (API_CONFIG.PENDING_ACCOUNT_MESSAGE.test(err.message || '') || API_CONFIG.REJECTED_ACCOUNT_MESSAGE.test(err.message || '')) {
        navigate('/pending-approval', {
          state: { email: values.email, message: err.message, rejected: API_CONFIG.REJECTED_ACCOUNT_MESSAGE.test(err.message || '') },
        });
        return;
      }
      setServerError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <header className="auth__head">
        <p className="eyebrow">Welcome back</p>
        <h2>Sign in to Yatra</h2>
        <p className="muted">Use the email registered with your hostel office.</p>
      </header>

      {location.state?.registered && (
        <Notice tone="success" title="Account created">You can now sign in with your new credentials.</Notice>
      )}
      {serverError && <Notice tone="error" title="Sign-in failed">{serverError}</Notice>}

      <form className="form" onSubmit={submit} noValidate>
        <TextField
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@college.edu"
          value={values.email}
          onChange={set('email')}
          error={errors.email}
          required
        />
        <PasswordField
          icon={Lock}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          onChange={set('password')}
          error={errors.password}
          required
        />
        <Button type="submit" size="lg" block loading={loading} iconRight={ArrowRight}>
          {loading ? 'Signing in' : 'Continue'}
        </Button>
        {slow && (
          <Notice tone="info" title="Waking up the server…">
            The hosted server sleeps when idle. The first sign-in can take up to a minute — please keep this page open.
          </Notice>
        )}
      </form>

      <p className="auth__note"><Info size={15} aria-hidden /> Your account role decides which workspace opens — Student, Warden, Guard or Admin.</p>

      <p className="auth__switch">
        New to the hostel? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
