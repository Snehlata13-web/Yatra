import { useMemo, useState } from 'react';
import { Wrench, Eye, ArrowRight, SearchX, Info, FilterX } from 'lucide-react';
import { useResource, useAction } from '../../hooks/useResource';
import { useAuth } from '../../context/AuthContext';
import { complaintApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { COMPLAINT_CATEGORIES, WARDEN_COMPLAINT_ACTIONS } from '../../config/app.config';
import {
  PageHeader, FilterSelect, SearchField, TableSkeleton, ErrorState, EmptyState, Button, IconButton, ConfirmModal, Drawer, StatusBadge, Card, DetailList, Notice, statusLabel,
} from '../../components/ui';
import { CategoryTag, ComplaintProgress } from '../../components/domain/Complaint';
import { formatDateTime, shortId } from '../../utils/format';

const STATUS_OPTIONS = ['pending', 'in_progress', 'awaiting_confirmation', 'reopened', 'resolved'];

export default function WardenComplaints() {
  const toast = useToast();
  const { user } = useAuth();
  const readOnly = user.role !== 'warden';
  const res = useResource(complaintApi.all);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('active');
  const [room, setRoom] = useState('');
  const [viewing, setViewing] = useState(null);
  const [pending, setPending] = useState(null); // complaint for transition
  const action = useAction((c) => complaintApi.updateStatus(c.id, WARDEN_COMPLAINT_ACTIONS[c.status].next));

  const all = res.data || [];
  const rows = useMemo(() => all.filter((c) => {
    if (category !== 'all' && c.category !== category) return false;
    if (status === 'active' && !['pending', 'in_progress', 'reopened'].includes(c.status)) return false;
    if (status !== 'active' && status !== 'all' && c.status !== status) return false;
    if (room.trim() && !String(c.roomNumber ?? '').toLowerCase().includes(room.trim().toLowerCase())) return false;
    return true;
  }), [all, category, status, room]);
  const filtersOn = category !== 'all' || status !== 'active' || room;

  const transition = async () => {
    const meta = WARDEN_COMPLAINT_ACTIONS[pending.status];
    try {
      await action.run(pending);
      toast.success(`Moved to ${statusLabel(meta.next)}`, `Complaint ${shortId(pending.id)} · Room ${pending.roomNumber ?? '—'}`);
      setPending(null);
      setViewing(null);
      res.refresh();
    } catch { /* inline */ }
  };

  const ActionBtn = ({ c, size = 'sm' }) => {
    const meta = WARDEN_COMPLAINT_ACTIONS[c.status];
    if (readOnly) return null;
    if (!meta) return <span className="muted-sm">{c.status === 'awaiting_confirmation' ? 'Waiting on student' : 'Closed'}</span>;
    return <Button size={size} variant="primary" iconRight={ArrowRight} onClick={() => setPending(c)}>{meta.label}</Button>;
  };

  return (
    <div className="stack-xl">
      <PageHeader icon={Wrench} eyebrow="Maintenance" title="Complaints" description="Coordinate repairs and update progress. Students confirm the final resolution." onRefresh={res.refresh} refreshing={res.refreshing} />

      <Notice tone="info">
        Repairs are coordinated with maintenance staff outside Yatra. Mark work done when finished — the student confirms if it’s resolved.
      </Notice>

      <div className="toolbar toolbar--filters">
        <FilterSelect label="Category" value={category} onChange={setCategory} options={[{ value: 'all', label: 'All categories' }, ...COMPLAINT_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: 'active', label: 'Needs action' }, { value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: statusLabel(s) }))]} />
        <SearchField value={room} onChange={setRoom} placeholder="Room number" label="Filter by room number" />
        {filtersOn && <Button variant="text" icon={FilterX} onClick={() => { setCategory('all'); setStatus('active'); setRoom(''); }}>Reset</Button>}
      </div>

      <Card padded={false}>
        {res.loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : res.error ? (
          <ErrorState error={res.error} onRetry={res.reload} />
        ) : all.length === 0 ? (
          <EmptyState art="complaints" icon={Wrench} title="No complaints yet" message="Student maintenance complaints will appear here." />
        ) : rows.length === 0 ? (
          <EmptyState art="search" icon={SearchX} title="Nothing matches these filters" action={<Button variant="secondary" onClick={() => { setCategory('all'); setStatus('all'); setRoom(''); }}>Show all complaints</Button>} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Room</th>
                  <th scope="col">Block</th>
                  <th scope="col">Category</th>
                  <th scope="col">Problem</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="ta-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className={c.status === 'reopened' ? 'is-flagged' : ''}>
                    <td data-label="ID"><span className="mono-id">{shortId(c.id)}</span></td>
                    <td data-label="Room"><strong>{c.roomNumber ?? '—'}</strong></td>
                    <td data-label="Block">{c.blockNumber ?? '—'}</td>
                    <td data-label="Category"><CategoryTag category={c.category} /></td>
                    <td data-label="Problem" className="td-clip">
                      <div>
                        {c.title && <strong className="td-title">{c.title}</strong>}
                        <span className="td-clamp" title={c.description}>{c.description}</span>
                      </div>
                    </td>
                    <td data-label="Status"><StatusBadge status={c.status} size="sm" /></td>
                    <td data-label="Actions" className="ta-right">
                      <div className="row-actions">
                        <ActionBtn c={c} />
                        <IconButton icon={Eye} label="View complaint" onClick={() => setViewing(c)} />
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
        title={viewing?.title || 'Complaint'}
        subtitle={viewing && `Complaint ${shortId(viewing.id)}`}
        footer={viewing && !readOnly && WARDEN_COMPLAINT_ACTIONS[viewing.status] && <ActionBtn c={viewing} size="md" />}
      >
        {viewing && (
          <div className="stack-lg">
            <div className="row gap-8"><CategoryTag category={viewing.category} /><StatusBadge status={viewing.status} /></div>
            <ComplaintProgress status={viewing.status} />
            <p className="prose">{viewing.description}</p>
            <DetailList items={[
              { label: 'Room', value: viewing.roomNumber },
              { label: 'Block', value: viewing.blockNumber },
              { label: 'Category', value: viewing.category },
              { label: 'Submitted', value: formatDateTime(viewing.createdAt) },
              viewing.updatedAt && { label: 'Last updated', value: formatDateTime(viewing.updatedAt) },
            ]} />
            {viewing.status === 'awaiting_confirmation' && <Notice tone="warning" title="Waiting on student">The student will confirm the fix or reopen the complaint.</Notice>}
            {viewing.status === 'reopened' && <Notice tone="error" title="Reopened by student">The student reported the problem is not solved yet.</Notice>}
            <p className="fine-print"><Info size={14} aria-hidden /> Student identity is not shown on complaints.</p>
          </div>
        )}
      </Drawer>

      <ConfirmModal
        open={Boolean(pending)}
        onClose={() => { setPending(null); action.clearError(); }}
        onConfirm={transition}
        loading={action.pending}
        error={action.error}
        title="Update complaint status?"
        confirmLabel={pending ? WARDEN_COMPLAINT_ACTIONS[pending.status]?.label : ''}
      >
        {pending && (
          <div className="transition">
            <StatusBadge status={pending.status} />
            <ArrowRight size={16} aria-hidden />
            <StatusBadge status={WARDEN_COMPLAINT_ACTIONS[pending.status].next} />
          </div>
        )}
        {pending?.status === 'in_progress' && <p className="muted mt-8">The student will be asked to confirm whether the problem is solved.</p>}
      </ConfirmModal>
    </div>
  );
}
