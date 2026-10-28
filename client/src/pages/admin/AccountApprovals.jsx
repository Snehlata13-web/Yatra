import { useState } from 'react';
import { UserCheck, Check, X, ShieldCheck, ScanLine, Info } from 'lucide-react';
import { useResource, useAction } from '../../hooks/useResource';
import { adminApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { ROLE_LABEL } from '../../config/app.config';
import { PageHeader, Card, TableSkeleton, ErrorState, EmptyState, Button, ConfirmModal, StatusBadge, StatCard, DetailList, FilterSelect } from '../../components/ui';
import { initials } from '../../utils/format';

export default function AccountApprovals() {
  const toast = useToast();
  const res = useResource(adminApi.pending);
  const [role, setRole] = useState('all');
  const [decision, setDecision] = useState(null);
  const action = useAction(({ account, kind }) => (kind === 'approve' ? adminApi.approve(account.id) : adminApi.reject(account.id)));

  const all = (res.data || []).filter((a) => a.approvalStatus === 'pending' || !a.approvalStatus);
  const rows = all.filter((a) => role === 'all' || a.role === role);

  const decide = async () => {
    try {
      await action.run(decision);
      toast.success(decision.kind === 'approve' ? 'Account approved' : 'Account rejected', `${decision.account.name} · ${ROLE_LABEL[decision.account.role]}`);
      setDecision(null);
      res.refresh();
    } catch { /* inline */ }
  };

  return (
    <div className="stack-xl">
      <PageHeader icon={UserCheck} eyebrow="Administration" title="Account Approvals" description="Approve Warden and Guard accounts before they can sign in." onRefresh={res.refresh} refreshing={res.refreshing} />

      <section className="stat-grid stat-grid--3">
        <StatCard label="Pending requests" value={all.length} icon={UserCheck} tone="amber" loading={res.loading} />
        <StatCard label="Warden requests" value={all.filter((a) => a.role === 'warden').length} icon={ShieldCheck} tone="copper" loading={res.loading} />
        <StatCard label="Guard requests" value={all.filter((a) => a.role === 'guard').length} icon={ScanLine} tone="brown" loading={res.loading} />
      </section>

      <div className="toolbar toolbar--filters">
        <FilterSelect label="Requested role" value={role} onChange={setRole} options={[{ value: 'all', label: 'All roles' }, { value: 'warden', label: 'Warden' }, { value: 'guard', label: 'Guard' }]} />
        <p className="fine-print"><Info size={14} aria-hidden /> Student accounts are approved automatically. Admin accounts can’t be created here.</p>
      </div>

      <Card padded={false}>
        {res.loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : res.error ? (
          <ErrorState error={res.error} onRetry={res.reload} />
        ) : rows.length === 0 ? (
          <EmptyState art="approvals" icon={UserCheck} title="No pending accounts" message="New Warden and Guard registrations will appear here for approval." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Requested role</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="ta-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td data-label="Name">
                      <span className="person"><span className="avatar avatar--sm">{initials(a.name)}</span><strong>{a.name}</strong></span>
                    </td>
                    <td data-label="Email" className="td-break">{a.email}</td>
                    <td data-label="Role"><span className={`role-tag role-tag--${a.role}`}>{ROLE_LABEL[a.role]}</span></td>
                    <td data-label="Status"><StatusBadge status="pending" size="sm" /></td>
                    <td data-label="Actions" className="ta-right">
                      <div className="row-actions">
                        <Button size="sm" variant="success" icon={Check} onClick={() => setDecision({ account: a, kind: 'approve' })}>Approve</Button>
                        <Button size="sm" variant="danger-soft" icon={X} onClick={() => setDecision({ account: a, kind: 'reject' })}>Reject</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmModal
        open={Boolean(decision)}
        onClose={() => { setDecision(null); action.clearError(); }}
        onConfirm={decide}
        loading={action.pending}
        error={action.error}
        tone={decision?.kind === 'approve' ? 'success' : 'danger'}
        title={decision?.kind === 'approve' ? 'Approve this account?' : 'Reject this account?'}
        confirmLabel={decision?.kind === 'approve' ? 'Approve account' : 'Reject account'}
        message={decision?.kind === 'approve'
          ? `They will be able to sign in to the ${ROLE_LABEL[decision?.account.role]} workspace.`
          : 'They will not be able to sign in. This cannot be undone from here.'}
      >
        {decision && <DetailList items={[{ label: 'Name', value: decision.account.name }, { label: 'Email', value: decision.account.email }, { label: 'Role', value: ROLE_LABEL[decision.account.role] }]} />}
      </ConfirmModal>
    </div>
  );
}
