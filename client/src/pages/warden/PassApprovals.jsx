import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlarmClock, Check, ClipboardCheck, Clock3, Eye, LogIn, LogOut, SearchX, X } from 'lucide-react';
import { useResource, useAction } from '../../hooks/useResource';
import { passApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Tabs, SearchField, TableSkeleton, ErrorState, EmptyState, Button, IconButton, ConfirmModal, Drawer, StatusBadge, Card, DetailList } from '../../components/ui';
import { PassDetails, StageState, ReturnTiming, returnTiming } from '../../components/domain/Pass';
import { formatDateTime, shortId, durationBetween } from '../../utils/format';

const isApproved = (p) => p.status === 'approved';
const TABS = [
  {
    value: 'pending', label: 'Needs Review', match: (p) => p.status === 'pending',
    empty: ['Review queue is empty', 'New student requests will appear here for your decision.'],
  },
  {
    value: 'not_left', label: 'Approved · Not left', icon: Clock3, match: (p) => isApproved(p) && !p.currentStage,
    empty: ['No one waiting to leave', 'Approved passes appear here until the guard marks the student OUT.'],
  },
  {
    value: 'out', label: 'Outside now', icon: LogOut, match: (p) => isApproved(p) && p.currentStage === 'OUT',
    empty: ['Everyone is inside', 'Students marked OUT at the gate appear here until they return.'],
  },
  {
    value: 'returned', label: 'Returned', icon: LogIn, match: (p) => isApproved(p) && p.currentStage === 'IN',
    empty: ['No returns yet', 'Students marked IN at the gate are listed here.'],
  },
  {
    value: 'rejected', label: 'Rejected', match: (p) => p.status === 'rejected',
    empty: ['No rejected passes', 'Passes you reject will be listed here.'],
  },
];
const byTab = Object.fromEntries(TABS.map((t) => [t.value, t]));
const SORT = {
  pending: (a, b) => new Date(a.departureTime) - new Date(b.departureTime),
  not_left: (a, b) => new Date(a.departureTime) - new Date(b.departureTime),
  out: (a, b) => new Date(a.returnTime) - new Date(b.returnTime),     // most overdue first
  returned: (a, b) => new Date(b.gateInAt || b.returnTime) - new Date(a.gateInAt || a.returnTime),
  rejected: () => 0,
};

export default function PassApprovals() {
  const toast = useToast();
  const { user } = useAuth();
  const readOnly = user.role !== 'warden'; // admin: view only — decisions belong to the warden
  const res = useResource(passApi.all);
  const [params] = useSearchParams();
  const [tab, setTab] = useState(() => (byTab[params.get('tab')] ? params.get('tab') : 'pending'));
  const [q, setQ] = useState('');
  const [decision, setDecision] = useState(null); // { pass, kind }
  const [viewing, setViewing] = useState(null);
  const action = useAction(({ pass, kind }) => (kind === 'approve' ? passApi.approve(pass.id) : passApi.reject(pass.id)));

  const all = res.data || [];
  const rows = all
    .filter(byTab[tab].match)
    .filter((p) => !q.trim() || [p.id, p.destination, p.reason, p.student?.name, p.student?.rollNumber, p.student?.branch, p.student?.roomNumber].some((v) => String(v ?? '').toLowerCase().includes(q.toLowerCase())))
    .sort(SORT[tab]);
  const overdue = all.filter((p) => byTab.out.match(p) && returnTiming(p)?.status === 'overdue');

  const decide = async () => {
    try {
      await action.run(decision);
      toast.success(decision.kind === 'approve' ? 'Pass approved' : 'Pass rejected', `${shortId(decision.pass.id)} · ${decision.pass.destination}`);
      setDecision(null);
      setViewing(null);
      res.refresh();
    } catch { /* shown inline */ }
  };

  const actions = (p) =>
    p.status === 'pending' && !readOnly ? (
      <div className="row-actions">
        <Button size="sm" variant="success" icon={Check} onClick={() => setDecision({ pass: p, kind: 'approve' })}>Approve</Button>
        <Button size="sm" variant="danger-soft" icon={X} onClick={() => setDecision({ pass: p, kind: 'reject' })}>Reject</Button>
        <IconButton icon={Eye} label="View details" onClick={() => setViewing(p)} />
      </div>
    ) : (
      <div className="row-actions"><Button size="sm" variant="text" icon={Eye} onClick={() => setViewing(p)}>Details</Button></div>
    );

  return (
    <div className="stack-xl">
      <PageHeader icon={ClipboardCheck} eyebrow={readOnly ? 'All hostel passes' : 'Warden desk'} title={readOnly ? 'Passes' : 'Pass Approvals'} description="Review outing requests and see who is waiting to leave, outside campus, or back in the hostel." onRefresh={res.refresh} refreshing={res.refreshing} />

      <div className="toolbar">
        <Tabs label="Approval status" value={tab} onChange={setTab} items={TABS.map(({ value, label, icon, match }) => ({ value, label, icon, count: res.data ? all.filter(match).length : undefined }))} />
        <SearchField value={q} onChange={setQ} placeholder="Search student, roll no., destination" label="Search passes" />
      </div>

      {overdue.length > 0 && (tab === 'out' || tab === 'pending') && (
        <button type="button" className="callout callout--danger" onClick={() => setTab('out')}>
          <span className="callout__icon"><AlarmClock size={20} aria-hidden /></span>
          <span className="callout__text">
            <strong>{overdue.length} student{overdue.length > 1 ? 's are' : ' is'} overdue</strong>
            <small>{overdue.slice(0, 3).map((p) => p.student?.name || shortId(p.id)).join(', ')}{overdue.length > 3 ? '…' : ''} — past their expected return time and still outside.</small>
          </span>
        </button>
      )}

      <Card padded={false}>
        {res.loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : res.error ? (
          <ErrorState error={res.error} onRetry={res.reload} />
        ) : rows.length === 0 ? (
          q ? <EmptyState art="search" icon={SearchX} title="No matches" message="No passes match your search in this tab." /> : (
            <EmptyState
              icon={ClipboardCheck}
              art={tab === 'out' || tab === 'returned' ? 'gate' : 'passes'}
              title={byTab[tab].empty[0]}
              message={byTab[tab].empty[1]}
            />
          )
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Pass ID</th>
                  <th scope="col">Student</th>
                  <th scope="col">Destination</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Departure</th>
                  <th scope="col">Return</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="ta-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Pass ID"><span className="mono-id">{shortId(p.id)}</span></td>
                    <td data-label="Student">
                      {p.student ? (
                        <div className="td-person">
                          <strong>{p.student.name || '—'}</strong>
                          <small className="td-sub">{[p.student.rollNumber, [p.student.course, p.student.branch].filter(Boolean).join(' '), p.student.year && `Y${p.student.year}`].filter(Boolean).join(' · ')}</small>
                          {(p.student.roomNumber || p.student.blockNumber) && <small className="td-sub">Room {p.student.roomNumber ?? '—'} · Block {p.student.blockNumber ?? '—'}</small>}
                        </div>
                      ) : '—'}
                    </td>
                    <td data-label="Destination"><strong>{p.destination}</strong></td>
                    <td data-label="Reason" className="td-clip"><span className="td-clamp" title={p.reason}>{p.reason}</span></td>
                    <td data-label="Departure">{formatDateTime(p.departureTime)}</td>
                    <td data-label="Return">
                      <div>
                        {formatDateTime(p.returnTime)}
                        <small className="td-sub">{durationBetween(p.departureTime, p.returnTime)}</small>
                      </div>
                    </td>
                    <td data-label="Status">
                      <div className="td-badges">
                        <StatusBadge status={p.status} size="sm" />
                        {p.currentStage && <StageState pass={p} showTime />}
                        <ReturnTiming pass={p} />
                      </div>
                    </td>
                    <td data-label="Actions" className="ta-right">{actions(p)}</td>
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
        title="Pass details"
        subtitle="Warden review"
        footer={viewing?.status === 'pending' && !readOnly && (
          <>
            <Button variant="danger-soft" icon={X} onClick={() => setDecision({ pass: viewing, kind: 'reject' })}>Reject</Button>
            <Button variant="success" icon={Check} onClick={() => setDecision({ pass: viewing, kind: 'approve' })}>Approve pass</Button>
          </>
        )}
      >
        {viewing && <PassDetails pass={viewing} />}
      </Drawer>

      <ConfirmModal
        open={Boolean(decision)}
        onClose={() => { setDecision(null); action.clearError(); }}
        onConfirm={decide}
        loading={action.pending}
        error={action.error}
        tone={decision?.kind === 'approve' ? 'success' : 'danger'}
        title={decision?.kind === 'approve' ? 'Approve this pass?' : 'Reject this pass?'}
        confirmLabel={decision?.kind === 'approve' ? 'Approve pass' : 'Reject pass'}
        message={decision?.kind === 'approve'
          ? 'The student will be cleared to leave once the gate guard verifies the pass.'
          : 'This cannot be undone. The student will need to submit a new request.'}
      >
        {decision && (
          <DetailList items={[
            { label: 'Pass', value: shortId(decision.pass.id) },
            decision.pass.student && { label: 'Student', value: `${decision.pass.student.name}${decision.pass.student.rollNumber ? ` · ${decision.pass.student.rollNumber}` : ''}` },
            { label: 'Destination', value: decision.pass.destination },
            { label: 'Leaves', value: formatDateTime(decision.pass.departureTime) },
            { label: 'Returns', value: formatDateTime(decision.pass.returnTime) },
          ]} />
        )}
      </ConfirmModal>
    </div>
  );
}
