import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, ShieldCheck, LogOut, Save, DoorOpen, Building2, Hash, GraduationCap, CalendarRange, User, UserRound, BadgeInfo, BookOpen, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { profileApi } from '../../api/services';
import { API_CONFIG } from '../../config/api.config';
import { ROLE_LABEL } from '../../config/app.config';
import { PageHeader, Card, Button, TextField, Notice, StatusBadge, DetailList } from '../../components/ui';
import { initials } from '../../utils/format';
import { validate, phone as phoneRule, minLen } from '../../utils/validate';

const EDITABLE = API_CONFIG.PROFILE_EDITABLE_FIELDS;

function ContactForm() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState({ phone: user.phone || '', name: user.name || '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const editable = EDITABLE.filter((f) => ['phone', 'name'].includes(f));
  const dirty = editable.some((f) => (values[f] || '').trim() !== (user[f] || ''));

  const save = async (e) => {
    e.preventDefault();
    const errs = validate(values, { name: [minLen(2, 'Name')], phone: [phoneRule()] });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setServerError('');
    try {
      const payload = Object.fromEntries(
        editable.filter((f) => (values[f] || '').trim() !== (user[f] || '')).map((f) => [f, values[f].trim()]),
      );
      const updated = await profileApi.update(user.id, payload);
      setUser((u) => ({ ...u, name: updated.name || u.name, phone: updated.phone ?? u.phone }));
      toast.success('Profile updated');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h3 className="card-title">Contact details</h3>
      {serverError && <Notice tone="error" title="Couldn’t save">{serverError}</Notice>}
      <form className="form" onSubmit={save} noValidate>
        <TextField label="Full name" icon={User} value={values.name} onChange={(e) => { setValues((v) => ({ ...v, name: e.target.value })); setErrors({}); }} error={errors.name} disabled={!EDITABLE.includes('name')} />
        <TextField label="Email" icon={Mail} value={user.email} disabled hint="Email is your sign-in ID and can’t be changed here" />
        <TextField label="Phone" icon={Phone} type="tel" placeholder="+919876543210" value={values.phone} onChange={(e) => { setValues((v) => ({ ...v, phone: e.target.value })); setErrors({}); }} error={errors.phone} disabled={!EDITABLE.includes('phone')} />
        {editable.length > 0 && (
          <div className="form-actions">
            <Button type="submit" icon={Save} loading={loading} disabled={!dirty}>{loading ? 'Saving' : 'Save changes'}</Button>
          </div>
        )}
      </form>
    </Card>
  );
}

function HostelRecord() {
  const { user } = useAuth();
  const sp = user.studentProfile || {};
  return (
    <Card>
      <h3 className="card-title">Hostel record</h3>
      {user.studentProfileMissing ? (
        <Notice tone="warning" title="Student profile not found">
          Your student record isn’t available on the server. Passes, complaints and food reviews need it — please contact the hostel office.
        </Notice>
      ) : (
        <DetailList
          items={[
            { label: <><Hash size={14} aria-hidden /> Roll number</>, value: sp.rollNumber },
            { label: <><BadgeInfo size={14} aria-hidden /> Admission no.</>, value: sp.admissionNumber },
            { label: <><Mail size={14} aria-hidden /> College email</>, value: sp.collegeEmail },
            { label: <><GraduationCap size={14} aria-hidden /> Course</>, value: sp.courseName },
            { label: <><BookOpen size={14} aria-hidden /> Branch</>, value: sp.branch },
            { label: <><CalendarRange size={14} aria-hidden /> Year · Batch</>, value: [sp.year && `Year ${sp.year}`, sp.batch].filter(Boolean).join(' · ') || undefined },
            { label: <><DoorOpen size={14} aria-hidden /> Room</>, value: sp.roomNumber },
            { label: <><Building2 size={14} aria-hidden /> Block</>, value: sp.blockNumber },
          ]}
        />
      )}
      <p className="fine-print mt-16"><Info size={14} aria-hidden /> Recorded at registration. Room and block are attached automatically to your complaints — contact the hostel office to change them.</p>
    </Card>
  );
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="stack-xl">
      <PageHeader icon={UserRound} eyebrow="Account" title="My Profile" description="Your hostel account details." />

      <div className="split">
        <div className="split__main stack-lg">
          <Card className="profile-hero">
            <span className="avatar avatar--xl">{initials(user.name)}</span>
            <div>
              <h2>{user.name}</h2>
              <p className="muted">{user.email}</p>
              <div className="row gap-8 mt-8">
                <span className="role-pill role-pill--solid"><ShieldCheck size={14} aria-hidden /> {ROLE_LABEL[user.role]}</span>
                <StatusBadge status={user.approvalStatus === 'approved' ? 'approved' : 'pending'} size="sm" label={user.approvalStatus === 'approved' ? 'Active account' : 'Pending approval'} />
              </div>
            </div>
          </Card>
          <ContactForm />
          {user.role === 'student' && <HostelRecord />}
        </div>

        <aside className="split__side stack-lg">
          <Card className="signout-card">
            <h3 className="card-title">Session</h3>
            <p className="muted">Signing out clears your secure session from this browser.</p>
            <Button variant="danger-soft" icon={LogOut} block onClick={() => { signOut(); navigate('/login', { replace: true }); }}>Sign out</Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
