import { useState } from 'react';
import {
  User, Mail, Lock, Phone, Hash, BadgeInfo, AtSign, BookOpen, Users, DoorOpen, Building2, Save, UserPlus,
} from 'lucide-react';
import { Button, TextField, PasswordField, SelectField, Notice } from '../../components/ui';
import { API_CONFIG } from '../../config/api.config';
import { validate, required, email, minLen, maxLen, phone as phoneRule } from '../../utils/validate';

const YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Year ${i + 1}` }));
const str = (v) => (v === undefined || v === null ? '' : String(v));

const STUDENT_RULES = {
  admissionNumber: [required('Admission number'), maxLen(50, 'Admission number')],
  rollNumber: [required('Roll number'), (v) => (/^\d{13}$/.test(v.trim()) ? undefined : 'Roll number must be exactly 13 digits')],
  collegeEmail: [required('College email'), email()],
  course: [required('Course')],
  branch: [required('Branch'), maxLen(100, 'Branch')],
  academicYear: [required('Academic year')],
  batch: [required('Batch'), maxLen(20, 'Batch')],
  roomNumber: [required('Room number'), maxLen(50, 'Room number')],
  blockNumber: [required('Block'), maxLen(50, 'Block')],
};

const fromAccount = (a) => ({
  name: a?.name || '',
  email: a?.email || '',
  phone: a?.phone || '',
  password: '',
  admissionNumber: str(a?.student?.admissionNumber),
  rollNumber: str(a?.student?.rollNumber),
  collegeEmail: str(a?.collegeEmail),
  course: str(a?.student?.course),
  branch: str(a?.student?.branch),
  academicYear: str(a?.student?.year),
  batch: str(a?.student?.batch),
  roomNumber: str(a?.student?.roomNumber),
  blockNumber: str(a?.student?.blockNumber),
});

const USER_KEYS = ['name', 'email', 'phone'];
const STUDENT_KEYS = Object.keys(STUDENT_RULES);

/** Add (account = null) or edit a student. onSubmit receives the payload; throw to show the error. */
export default function StudentForm({ account, onSubmit, onCancel }) {
  const editing = Boolean(account);
  const initial = fromAccount(account);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const courseOptions = [...API_CONFIG.COURSE_OPTIONS];
  if (values.course && !courseOptions.some((o) => o.value === values.course)) courseOptions.push({ value: values.course, label: values.course });

  const set = (k) => (e) => {
    const v = k === 'rollNumber' ? e.target.value.replace(/\D/g, '').slice(0, 13) : e.target.value;
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const changed = (keys) => Object.fromEntries(keys.filter((k) => values[k].trim() !== initial[k].trim()).map((k) => [k, values[k].trim()]));
  const dirty = !editing || Object.keys(changed([...USER_KEYS, ...STUDENT_KEYS])).length > 0;

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(values, {
      name: [required('Full name'), minLen(2, 'Full name')],
      email: [required('Email'), email()],
      phone: [phoneRule()],
      ...(editing ? {} : {
        password: [required('Password'), minLen(8, 'Password'), (v) => (/[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v) ? undefined : 'Use uppercase, lowercase and a number')],
      }),
      ...STUDENT_RULES,
    });
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.querySelector('.drawer [aria-invalid="true"]')?.focus();
      return;
    }
    setLoading(true);
    setServerError('');
    try {
      if (editing) {
        await onSubmit({ user: changed(USER_KEYS), student: changed(STUDENT_KEYS) });
      } else {
        const student = Object.fromEntries(STUDENT_KEYS.map((k) => [k, values[k].trim()]));
        await onSubmit({ name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim(), password: values.password, student });
      }
    } catch (err) {
      setServerError(err.message);
      document.querySelector('.drawer__body')?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      {serverError && <Notice tone="error" title={editing ? 'Couldn’t save changes' : 'Couldn’t add student'}>{serverError}</Notice>}
      {!editing && <Notice tone="info">The student is approved immediately. Share the email and password with them — they can sign in right away.</Notice>}

      <p className="form-section"><span>1</span> Account</p>
      <TextField label="Full name" icon={User} value={values.name} onChange={set('name')} error={errors.name} required />
      <div className="form-row">
        <TextField label="Email (sign-in)" type="email" icon={Mail} value={values.email} onChange={set('email')} error={errors.email} required />
        <TextField label="Phone" type="tel" icon={Phone} placeholder="+919876543210" value={values.phone} onChange={set('phone')} error={errors.phone} optional />
      </div>
      {!editing && (
        <PasswordField label="Initial password" icon={Lock} autoComplete="new-password" value={values.password} onChange={set('password')} error={errors.password} hint="8+ chars with upper, lower case & a number" required />
      )}

      <p className="form-section"><span>2</span> Academic</p>
      <div className="form-row">
        <TextField label="Admission number" icon={BadgeInfo} value={values.admissionNumber} onChange={set('admissionNumber')} error={errors.admissionNumber} required />
        <TextField label="Roll number" icon={Hash} inputMode="numeric" value={values.rollNumber} onChange={set('rollNumber')} error={errors.rollNumber} hint={`${values.rollNumber.length}/13 digits`} required />
      </div>
      <TextField label="College email" type="email" icon={AtSign} value={values.collegeEmail} onChange={set('collegeEmail')} error={errors.collegeEmail} required />
      <div className="form-row">
        <SelectField label="Course" placeholder="Select course" options={courseOptions} value={values.course} onChange={set('course')} error={errors.course} required />
        <TextField label="Branch" icon={BookOpen} value={values.branch} onChange={set('branch')} error={errors.branch} required />
      </div>
      <div className="form-row">
        <SelectField label="Academic year" placeholder="Select year" options={YEAR_OPTIONS} value={values.academicYear} onChange={set('academicYear')} error={errors.academicYear} required />
        <TextField label="Batch" icon={Users} placeholder="e.g. 2023-2027" value={values.batch} onChange={set('batch')} error={errors.batch} required />
      </div>

      <p className="form-section"><span>3</span> Hostel room</p>
      <div className="form-row">
        <TextField label="Room number" icon={DoorOpen} value={values.roomNumber} onChange={set('roomNumber')} error={errors.roomNumber} required />
        <TextField label="Block" icon={Building2} value={values.blockNumber} onChange={set('blockNumber')} error={errors.blockNumber} required />
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" icon={editing ? Save : UserPlus} loading={loading} disabled={!dirty}>
          {loading ? 'Saving' : editing ? 'Save changes' : 'Add student'}
        </Button>
      </div>
    </form>
  );
}
