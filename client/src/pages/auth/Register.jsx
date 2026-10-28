import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Phone, GraduationCap, ShieldCheck, ScanLine, ArrowRight, Hash, BadgeInfo, AtSign,
  BookOpen, CalendarRange, Users, DoorOpen, Building2,
} from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button, TextField, PasswordField, SelectField, Notice, Segmented } from '../../components/ui';
import { authApi } from '../../api/services';
import { API_CONFIG } from '../../config/api.config';
import { validate, required, email, minLen, maxLen } from '../../utils/validate';

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student', description: 'Warden approves', icon: GraduationCap },
  { value: 'warden', label: 'Warden', description: 'Admin approves', icon: ShieldCheck },
  { value: 'guard', label: 'Guard', description: 'Admin approves', icon: ScanLine },
];

const YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Year ${i + 1}` }));

const EMPTY_STUDENT = {
  admissionNumber: '', rollNumber: '', collegeEmail: '', course: '', branch: '',
  academicYear: '', batch: '', roomNumber: '', blockNumber: '',
};

const EMPTY_STAFF = { employeeId: '', phoneNumber: '', hostelBlock: '', gateNumber: '' };
const phoneOk = (v) => /^\+?[1-9]\d{7,14}$/.test(String(v).replace(/[\s()-]/g, ''));
const STAFF_RULES = {
  warden: {
    employeeId: [required('Employee ID'), maxLen(100, 'Employee ID')],
    phoneNumber: [required('Office phone'), (v) => (phoneOk(v) ? undefined : 'Enter a valid phone number, e.g. +919876543210')],
    hostelBlock: [required('Hostel block'), maxLen(100, 'Hostel block')],
  },
  guard: {
    employeeId: [required('Employee ID'), maxLen(100, 'Employee ID')],
    gateNumber: [required('Gate number'), maxLen(100, 'Gate number')],
  },
};

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

export default function Register() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', phone: '', role: 'student' });
  const [student, setStudent] = useState(EMPTY_STUDENT);
  const [staff, setStaff] = useState(EMPTY_STAFF);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const isStudent = values.role === 'student';

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };
  const setStaffField = (k) => (e) => {
    setStaff((st) => ({ ...st, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };
  const setS = (k) => (e) => {
    const value = k === 'rollNumber' ? e.target.value.replace(/\D/g, '').slice(0, 13) : e.target.value;
    setStudent((s) => ({ ...s, [k]: value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {
      ...validate(values, {
        name: [required('Full name'), minLen(2, 'Full name')],
        email: [required('Email'), email()],
        password: [required('Password'), minLen(8, 'Password'), (v) => (/[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v) ? undefined : 'Use uppercase, lowercase and a number')],
        phone: [(v) => (!v.trim() || /^\+?[1-9]\d{7,14}$/.test(v.replace(/[\s()-]/g, '')) ? undefined : 'Enter a valid phone number, e.g. +919876543210')],
      }),
      ...(isStudent ? validate(student, STUDENT_RULES) : validate(staff, STAFF_RULES[values.role])),
    };
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = document.querySelector('[aria-invalid="true"]');
      first?.focus();
      return;
    }

    setLoading(true);
    setServerError('');
    try {
      await authApi.register({
        ...values,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        student: isStudent ? student : undefined,
        staff: isStudent ? undefined : staff,
      });
      navigate('/pending-approval', { state: { email: values.email, role: values.role, justRegistered: true } });
    } catch (err) {
      setServerError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <header className="auth__head">
        <p className="eyebrow">Create account</p>
        <h2>Join your hostel on Yatra</h2>
        <p className="muted">Admin accounts are issued by the institute and cannot be registered here.</p>
      </header>

      {serverError && <Notice tone="error" title="Registration failed">{serverError}</Notice>}

      <form className="form" onSubmit={submit} noValidate>
        <fieldset className="fieldset">
          <legend className="field__label">I am registering as</legend>
          <Segmented name="role" label="Account role" options={ROLE_OPTIONS} value={values.role} onChange={(role) => { setValues((v) => ({ ...v, role })); setErrors({}); }} />
        </fieldset>
        <Notice tone="info">
          {isStudent
            ? 'Your hostel warden reviews every student registration. You can sign in once it is approved.'
            : 'Warden and Guard accounts must be approved by an administrator before you can sign in.'}
        </Notice>

        <p className="form-section"><span>1</span> Account details</p>
        <TextField label="Full name" icon={User} autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} required />
        <TextField label="Email" type="email" icon={Mail} autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} hint="You’ll use this to sign in" required />
        <div className="form-row">
          <PasswordField icon={Lock} autoComplete="new-password" value={values.password} onChange={set('password')} error={errors.password} hint="8+ chars with upper, lower case & a number" required />
          <TextField label="Phone" type="tel" icon={Phone} autoComplete="tel" value={values.phone} onChange={set('phone')} error={errors.phone} placeholder="+919876543210" optional />
        </div>

        {isStudent && (
          <div className="form-reveal">
            <p className="form-section"><span>2</span> Academic details</p>
            <div className="form-row">
              <TextField label="Admission number" icon={BadgeInfo} value={student.admissionNumber} onChange={setS('admissionNumber')} error={errors.admissionNumber} required />
              <TextField label="Roll number" icon={Hash} inputMode="numeric" value={student.rollNumber} onChange={setS('rollNumber')} error={errors.rollNumber} hint={`${student.rollNumber.length}/13 digits`} required />
            </div>
            <TextField label="College email" type="email" icon={AtSign} placeholder="you@glbitm.ac.in" value={student.collegeEmail} onChange={setS('collegeEmail')} error={errors.collegeEmail} required />
            <div className="form-row">
              <SelectField label="Course" placeholder="Select course" options={API_CONFIG.COURSE_OPTIONS} value={student.course} onChange={setS('course')} error={errors.course} required />
              <TextField label="Branch" icon={BookOpen} placeholder="e.g. CSE" value={student.branch} onChange={setS('branch')} error={errors.branch} required />
            </div>
            <div className="form-row">
              <SelectField label="Academic year" placeholder="Select year" options={YEAR_OPTIONS} value={student.academicYear} onChange={setS('academicYear')} error={errors.academicYear} required />
              <TextField label="Batch" icon={Users} placeholder="e.g. 2023-2027" value={student.batch} onChange={setS('batch')} error={errors.batch} required />
            </div>

            <p className="form-section"><span>3</span> Hostel room</p>
            <div className="form-row">
              <TextField label="Room number" icon={DoorOpen} placeholder="e.g. 204" value={student.roomNumber} onChange={setS('roomNumber')} error={errors.roomNumber} required />
              <TextField label="Block" icon={Building2} placeholder="e.g. A" value={student.blockNumber} onChange={setS('blockNumber')} error={errors.blockNumber} required />
            </div>
            <p className="fine-print"><CalendarRange size={14} aria-hidden /> Room and block are attached automatically to your maintenance complaints.</p>
          </div>
        )}

        {values.role === 'warden' && (
          <div className="form-reveal">
            <p className="form-section"><span>2</span> Warden details</p>
            <div className="form-row">
              <TextField label="Employee ID" icon={BadgeInfo} value={staff.employeeId} onChange={setStaffField('employeeId')} error={errors.employeeId} required />
              <TextField label="Office phone" type="tel" icon={Phone} placeholder="+919876543210" value={staff.phoneNumber} onChange={setStaffField('phoneNumber')} error={errors.phoneNumber} required />
            </div>
            <TextField label="Hostel block in charge" icon={Building2} placeholder="e.g. Block A" value={staff.hostelBlock} onChange={setStaffField('hostelBlock')} error={errors.hostelBlock} required />
          </div>
        )}
        {values.role === 'guard' && (
          <div className="form-reveal">
            <p className="form-section"><span>2</span> Guard details</p>
            <div className="form-row">
              <TextField label="Employee ID" icon={BadgeInfo} value={staff.employeeId} onChange={setStaffField('employeeId')} error={errors.employeeId} required />
              <TextField label="Gate number" icon={DoorOpen} placeholder="e.g. Main Gate 1" value={staff.gateNumber} onChange={setStaffField('gateNumber')} error={errors.gateNumber} required />
            </div>
          </div>
        )}

        <Button type="submit" size="lg" block loading={loading} iconRight={ArrowRight}>
          {loading ? 'Creating account' : 'Create account'}
        </Button>
      </form>

      <p className="auth__switch">Already registered? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
