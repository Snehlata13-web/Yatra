import { useMemo, useState } from 'react';
import { Users, UserCheck, UserPlus, Check, X, Eye, PencilLine, Trash2, SearchX, Clock3, CheckCircle2, XCircle } from 'lucide-react';
import { useResource, useAction } from '../../hooks/useResource';
import { wardenApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import {
  PageHeader, Card, TableSkeleton, ErrorState, EmptyState, Button, IconButton, ConfirmModal, StatusBadge, StatCard, DetailList, Drawer, SearchField, Tabs,
} from '../../components/ui';
import { StudentDetails } from '../../components/domain/Pass';
import { initials } from '../../utils/format';
import StudentForm from './StudentForm';

const academic = (st) => [st.course, st.branch, st.year && `Year ${st.year}`].filter(Boolean).join(' · ');
const TABS = [
  { value: 'all', label: 'All students' },
  { value: 'pending', label: 'Pending', icon: Clock3 },
  { value: 'approved', label: 'Active', icon: CheckCircle2 },
  { value: 'rejected', label: 'Rejected', icon: XCircle },
];
const inTab = (tab, a) => tab === 'all' || a.approvalStatus === tab;
const STATUS_LABEL = { approved: 'Active', pending: 'Pending', rejected: 'Rejected' };

export default function Students() {
  const toast = useToast();
  const res = useResource(wardenApi.students);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(null); // null | { mode: 'add' } | { mode: 'edit', account }
  const [confirm, setConfirm] = useState(null); // { account, kind: approve | reject | delete }
  const action = useAction(({ account, kind }) => {
    if (kind === 'approve') return wardenApi.approveStudent(account.id);
    if (kind === 'reject') return wardenApi.rejectStudent(account.id);
    return wardenApi.deleteStudent(account.id);
  });

  const all = res.data || [];
  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.value, all.filter((a) => inTab(t.value, a)).length])), [all]);
  const rows = all
    .filter((a) => inTab(tab, a))
    .filter((a) => !q.trim() || [a.name, a.email, a.student.rollNumber, a.student.branch, a.student.roomNumber, a.student.blockNumber]
      .some((v) => String(v ?? '').toLowerCase().includes(q.toLowerCase())))
    .sort((x, y) => (y.approvalStatus === 'pending') - (x.approvalStatus === 'pending') || x.name.localeCompare(y.name));

  const runConfirm = async () => {
    const { account, kind } = confirm;
    try {
      await action.run(confirm);
      toast.success({ approve: 'Student approved', reject: 'Registration rejected', delete: 'Student deleted' }[kind], account.name);
      setConfirm(null);
      setViewing(null);
      res.refresh();
    } catch { /* inline */ }
  };

  const saveForm = async (payload) => {
    if (form.mode === 'add') {
      await wardenApi.addStudent(payload);
      toast.success('Student added', `${payload.name} can sign in now.`);
    } else {
      await wardenApi.updateStudent(form.account, payload);
      toast.success('Student updated', form.account.name);
    }
    setForm(null);
    setViewing(null);
    res.refresh();
  };

  const COPY = {
    approve: { title: 'Approve this student?', label: 'Approve student', tone: 'success', msg: 'They will be able to sign in and use passes, complaints and food reviews.' },
    reject: { title: 'Reject this registration?', label: 'Reject registration', tone: 'danger', msg: 'They will not be able to sign in.' },
    delete: { title: 'Delete this student?', label: 'Delete student', tone: 'danger', msg: 'Their account, passes, complaints and food reviews will be permanently removed. This cannot be undone.' },
  };

  return (
    <div className="stack-xl">
      <PageHeader
        icon={Users}
        eyebrow="Warden desk"
        title="Students"
        description="Every hostel resident in one place — approve new sign-ups, add students and keep their details up to date."
        onRefresh={res.refresh}
        refreshing={res.refreshing}
        actions={<Button icon={UserPlus} onClick={() => setForm({ mode: 'add' })}>Add student</Button>}
      />

      <section className="stat-grid" aria-label="Summary">
        <StatCard label="Total students" value={counts.all} icon={Users} tone="copper" loading={res.loading} onClick={() => setTab('all')} />
        <StatCard label="Pending approval" value={counts.pending} icon={UserCheck} tone="amber" loading={res.loading} onClick={() => setTab('pending')} />
        <StatCard label="Active" value={counts.approved} icon={CheckCircle2} tone="sage" loading={res.loading} onClick={() => setTab('approved')} />
        <StatCard label="Rejected" value={counts.rejected} icon={XCircle} tone="brown" loading={res.loading} onClick={() => setTab('rejected')} />
      </section>

      <div className="toolbar">
        <Tabs label="Student status" value={tab} onChange={setTab} items={TABS.map((t) => ({ ...t, count: res.data ? counts[t.value] : undefined }))} />
        <SearchField value={q} onChange={setQ} placeholder="Name, roll no., branch, room" label="Search students" />
      </div>

      <Card padded={false}>
        {res.loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : res.error ? (
          <ErrorState error={res.error} onRetry={res.reload} />
        ) : all.length === 0 ? (
          <EmptyState art="approvals" title="No students yet" message="Students appear here when they register, or you can add them yourself." action={<Button icon={UserPlus} onClick={() => setForm({ mode: 'add' })}>Add student</Button>} />
        ) : rows.length === 0 ? (
          <EmptyState art="search" icon={SearchX} title="Nothing in this view" message="Try another tab or clear your search." compact />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Roll number</th>
                  <th scope="col">Course</th>
                  <th scope="col">Room</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="ta-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className={a.approvalStatus === 'pending' ? 'is-flagged' : ''}>
                    <td data-label="Student">
                      <span className="person">
                        <span className="avatar avatar--sm">{initials(a.name)}</span>
                        <span className="td-person"><strong>{a.name}</strong><small className="td-sub">{a.email}</small></span>
                      </span>
                    </td>
                    <td data-label="Roll number"><span className="mono-id">{a.student.rollNumber || '—'}</span></td>
                    <td data-label="Course">{academic(a.student) || '—'}{a.student.batch && <small className="td-sub">Batch {a.student.batch}</small>}</td>
                    <td data-label="Room">{a.student.roomNumber ?? '—'}{a.student.blockNumber && <small className="td-sub">Block {a.student.blockNumber}</small>}</td>
                    <td data-label="Status"><StatusBadge status={a.approvalStatus} size="sm" label={STATUS_LABEL[a.approvalStatus]} /></td>
                    <td data-label="Actions" className="ta-right">
                      <div className="row-actions">
                        {a.approvalStatus === 'pending' && (
                          <>
                            <Button size="sm" variant="success" icon={Check} onClick={() => setConfirm({ account: a, kind: 'approve' })}>Approve</Button>
                            <Button size="sm" variant="danger-soft" icon={X} onClick={() => setConfirm({ account: a, kind: 'reject' })}>Reject</Button>
                          </>
                        )}
                        <IconButton icon={Eye} label="View details" onClick={() => setViewing(a)} />
                        <IconButton icon={PencilLine} label="Edit student" onClick={() => setForm({ mode: 'edit', account: a })} />
                        <IconButton icon={Trash2} label="Delete student" className="icon-btn--danger" onClick={() => setConfirm({ account: a, kind: 'delete' })} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Drawer
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing?.name || 'Student'}
        subtitle={viewing && `Student · ${STATUS_LABEL[viewing.approvalStatus] || viewing.approvalStatus}`}
        footer={viewing && (
          <>
            <Button variant="danger-soft" icon={Trash2} onClick={() => setConfirm({ account: viewing, kind: 'delete' })}>Delete</Button>
            <Button variant="secondary" icon={PencilLine} onClick={() => setForm({ mode: 'edit', account: viewing })}>Edit</Button>
            {viewing.approvalStatus === 'pending' && <Button variant="success" icon={Check} onClick={() => setConfirm({ account: viewing, kind: 'approve' })}>Approve</Button>}
          </>
        )}
      >
        {viewing && (
          <div className="stack-lg">
            <StudentDetails student={{ ...viewing.student, name: viewing.name, email: viewing.email, phone: viewing.phone }} />
            {viewing.collegeEmail && <DetailList items={[{ label: 'College email', value: viewing.collegeEmail }]} />}
          </div>
        )}
      </Drawer>

      <Drawer
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?.mode === 'edit' ? `Edit ${form.account.name}` : 'Add student'}
        subtitle={form?.mode === 'edit' ? 'Update details' : 'New hostel resident'}
        width={620}
      >
        {form && <StudentForm key={form.account?.id || 'new'} account={form.account} onSubmit={saveForm} onCancel={() => setForm(null)} />}
      </Drawer>

      <ConfirmModal
        open={Boolean(confirm)}
        onClose={() => { setConfirm(null); action.clearError(); }}
        onConfirm={runConfirm}
        loading={action.pending}
        error={action.error}
        tone={confirm ? COPY[confirm.kind].tone : 'primary'}
        title={confirm ? COPY[confirm.kind].title : ''}
        confirmLabel={confirm ? COPY[confirm.kind].label : ''}
        message={confirm ? COPY[confirm.kind].msg : ''}
      >
        {confirm && (
          <DetailList items={[
            { label: 'Name', value: confirm.account.name },
            { label: 'Roll number', value: confirm.account.student.rollNumber },
            { label: 'Course', value: academic(confirm.account.student) },
            { label: 'Room', value: [confirm.account.student.roomNumber, confirm.account.student.blockNumber].filter(Boolean).join(' · ') },
          ]} />
        )}
      </ConfirmModal>
    </div>
  );
}
