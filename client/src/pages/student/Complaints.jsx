import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wrench, PlusCircle, ThumbsUp, RotateCcw, DoorOpen, Building2, Send, ImagePlus, SearchX, BellRing } from 'lucide-react';
import { useResource, useAction } from '../../hooks/useResource';
import { complaintApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_CONFIG } from '../../config/api.config';
import { COMPLAINT_CATEGORIES } from '../../config/app.config';
import {
  PageHeader, Tabs, CardSkeleton, ErrorState, EmptyState, Button, Drawer, ConfirmModal, TextField, TextArea, SelectField, Notice,
} from '../../components/ui';
import { ComplaintCard, CATEGORY_ICON } from '../../components/domain/Complaint';
import { validate, required, minLen, maxLen } from '../../utils/validate';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'awaiting_confirmation', label: 'Needs your input' },
  { value: 'resolved', label: 'Resolved' },
];
const matches = (tab, c) =>
  tab === 'all' || (tab === 'open' ? ['pending', 'in_progress', 'reopened'].includes(c.status) : c.status === tab);

function NewComplaintForm({ onDone, onCancel }) {
  const { user } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState({ category: '', title: '', description: '', photo: null });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const room = user.studentProfile?.roomNumber;
  const block = user.studentProfile?.blockNumber;

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(values, {
      category: [required('Category')],
      title: [required('Problem title'), minLen(4, 'Problem title'), maxLen(100, 'Problem title')],
      description: [required('Problem description'), minLen(10, 'Problem description'), maxLen(1000, 'Problem description')],
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setServerError('');
    try {
      await complaintApi.create({
        category: values.category,
        title: values.title.trim(),
        description: values.description.trim(),
        photo: values.photo,
      });
      toast.success('Complaint submitted', 'The warden has been notified.');
      onDone();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="complaint-form" className="form" onSubmit={submit} noValidate>
      <div className="room-strip">
        <span><DoorOpen size={16} aria-hidden /> Room <strong>{room ?? 'not set'}</strong></span>
        <span><Building2 size={16} aria-hidden /> Block <strong>{block ?? 'not set'}</strong></span>
        <small>From your student profile</small>
      </div>
      {(room === undefined || room === null) && (
        <Notice tone="warning">Your profile has no room on record yet. Add your room and block in My Profile so the warden knows where to send help.</Notice>
      )}
      {serverError && <Notice tone="error" title="Couldn’t submit complaint">{serverError}</Notice>}

      <SelectField label="Category" value={values.category} onChange={set('category')} options={COMPLAINT_CATEGORIES} placeholder="Choose a category" error={errors.category} required />
      {values.category && (
        <p className="cat-hint">
          {(() => { const Icon = CATEGORY_ICON[values.category]; return <Icon size={15} aria-hidden />; })()}
          {{ Carpenter: 'Doors, furniture, cupboards, windows', Electricity: 'Lights, fans, sockets, switches', Plumber: 'Taps, drains, flush, water leakage', Other: 'Anything else in your room or block' }[values.category]}
        </p>
      )}
      <TextField label="Problem title" placeholder="e.g. Ceiling fan not working" value={values.title} onChange={set('title')} error={errors.title} maxLength={100} required />
      <TextArea label="Problem description" rows={5} placeholder="Describe what’s wrong, since when, and anything the technician should know." value={values.description} onChange={set('description')} error={errors.description} maxLength={1000} required />

      {API_CONFIG.COMPLAINT_PHOTO_UPLOAD && (
        <label className="upload">
          <ImagePlus size={20} aria-hidden />
          <span>{values.photo ? values.photo.name : 'Attach a photo (optional)'}</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => setValues((v) => ({ ...v, photo: e.target.files?.[0] || null }))} />
        </label>
      )}

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" icon={Send} loading={loading}>{loading ? 'Submitting' : 'Submit complaint'}</Button>
      </div>
    </form>
  );
}

export default function StudentComplaints() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const res = useResource(complaintApi.mine);
  const [tab, setTab] = useState('all');
  const [compose, setCompose] = useState(Boolean(location.state?.compose));
  const [confirm, setConfirm] = useState(null); // { complaint, kind: 'solved' | 'reopen' }
  const action = useAction((c, kind) => (kind === 'solved' ? complaintApi.confirm(c.id) : complaintApi.reopen(c.id)));

  useEffect(() => {
    if (location.state?.compose) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const list = res.data || [];
  const filtered = list.filter((c) => matches(tab, c));
  const awaiting = list.filter((c) => c.status === 'awaiting_confirmation').length;

  const runConfirm = async () => {
    try {
      await action.run(confirm.complaint, confirm.kind);
      toast.success(confirm.kind === 'solved' ? 'Marked as resolved' : 'Complaint reopened', confirm.kind === 'solved' ? 'Thanks for confirming the fix.' : 'The warden will follow up again.');
      setConfirm(null);
      res.refresh();
    } catch { /* inline error shown in modal */ }
  };

  return (
    <div className="stack-xl">
      <PageHeader icon={Wrench}
        eyebrow="Maintenance"
        title="My Complaints"
        description="Raise room issues and confirm when they’re actually fixed."
        onRefresh={res.refresh}
        refreshing={res.refreshing}
        actions={<Button icon={PlusCircle} onClick={() => setCompose(true)}>New complaint</Button>}
      />

      {awaiting > 0 && (
        <Notice tone="warning" title={`${awaiting} complaint${awaiting > 1 ? 's need' : ' needs'} your confirmation`}>
          The warden marked the work as done. Let them know if the problem is solved.
        </Notice>
      )}

      <Tabs label="Complaint status" value={tab} onChange={setTab} items={TABS.map((t) => ({ ...t, count: res.data ? list.filter((c) => matches(t.value, c)).length : undefined }))} />

      {res.loading ? (
        <CardSkeleton count={4} />
      ) : res.error ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : list.length === 0 ? (
        <EmptyState art="complaints" icon={Wrench} title="No complaints raised" message="Broken fan, leaking tap or a door that won’t lock? Let the warden know." action={<Button icon={PlusCircle} onClick={() => setCompose(true)}>New complaint</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState art="search" icon={SearchX} title="Nothing in this view" message="Try another tab to see your other complaints." compact />
      ) : (
        <div className="card-grid">
          {filtered.map((c) => (
            <ComplaintCard key={c.id} complaint={c}>
              {c.status === 'awaiting_confirmation' && (
                <div className="confirm-bar">
                  <p><BellRing size={15} aria-hidden /> Is the problem fixed?</p>
                  <div className="confirm-bar__btns">
                    <Button size="sm" variant="success" icon={ThumbsUp} onClick={() => setConfirm({ complaint: c, kind: 'solved' })}>Problem Solved</Button>
                    <Button size="sm" variant="danger-soft" icon={RotateCcw} onClick={() => setConfirm({ complaint: c, kind: 'reopen' })}>Still Not Solved</Button>
                  </div>
                </div>
              )}
            </ComplaintCard>
          ))}
        </div>
      )}

      <Drawer open={compose} onClose={() => setCompose(false)} title="New complaint" subtitle="Maintenance request">
        <NewComplaintForm onCancel={() => setCompose(false)} onDone={() => { setCompose(false); res.refresh(); }} />
      </Drawer>

      <ConfirmModal
        open={Boolean(confirm)}
        onClose={() => { setConfirm(null); action.clearError(); }}
        onConfirm={runConfirm}
        loading={action.pending}
        error={action.error}
        tone={confirm?.kind === 'solved' ? 'success' : 'danger'}
        title={confirm?.kind === 'solved' ? 'Confirm the problem is solved?' : 'Reopen this complaint?'}
        confirmLabel={confirm?.kind === 'solved' ? 'Yes, it’s solved' : 'Reopen complaint'}
        message={
          confirm?.kind === 'solved'
            ? `“${confirm?.complaint.title}” will be marked Resolved and closed.`
            : `“${confirm?.complaint.title}” will be sent back to the warden as Reopened.`
        }
      />
    </div>
  );
}
