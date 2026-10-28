import { useMemo, useState } from 'react';
import { BadgeCheck, SearchX, LogOut, LogIn, Clock3, AlarmClock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useResource } from '../../hooks/useResource';
import { passApi } from '../../api/services';
import { PageHeader, Tabs, SearchField, CardSkeleton, ErrorState, EmptyState, Notice, Drawer, StatCard } from '../../components/ui';
import { PassCard, PassDetails, returnTiming } from '../../components/domain/Pass';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'none', label: 'Not left', icon: Clock3 },
  { value: 'OUT', label: 'Out now', icon: LogOut },
  { value: 'IN', label: 'Returned', icon: LogIn },
];
const inTab = (tab, p) => tab === 'all' || (tab === 'none' ? !p.currentStage : p.currentStage === tab);

/** Read-only history of passes this guard verified. Pass IDs are not shown here. */
export default function VerifiedPasses() {
  const { user } = useAuth();
  const res = useResource(passApi.guardList);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);

  const mine = useMemo(() => {
    const verified = (res.data || []).filter((p) => p.status === 'approved' && p.guardVerified);
    const hasApprover = verified.some((p) => p.guardApproverId !== undefined && p.guardApproverId !== null);
    return hasApprover ? verified.filter((p) => String(p.guardApproverId) === String(user.id)) : verified;
  }, [res.data, user.id]);

  const rows = mine.filter((p) => inTab(tab, p) && (!q.trim()
    || [p.student?.name, p.student?.rollNumber, p.student?.branch, p.destination].some((v) => String(v ?? '').toLowerCase().includes(q.trim().toLowerCase()))));

  return (
    <div className="stack-xl">
      <PageHeader icon={BadgeCheck} eyebrow="Gate records" title="Verified Passes" description="Passes you have verified, with exact exit and return times — view only. To record a return, search the pass ID on the Gate Desk." onRefresh={res.refresh} refreshing={res.refreshing} />

      <section className="stat-grid" aria-label="Summary">
        <StatCard label="Verified by you" value={mine.length} icon={BadgeCheck} tone="sage" loading={res.loading} />
        <StatCard label="Out now" value={mine.filter((p) => p.currentStage === 'OUT').length} icon={LogOut} tone="copper" loading={res.loading} />
        <StatCard label="Returned" value={mine.filter((p) => p.currentStage === 'IN').length} icon={LogIn} tone="brown" loading={res.loading} />
        <StatCard label="Overdue / late" value={mine.filter((p) => ['overdue', 'late'].includes(returnTiming(p)?.status)).length} icon={AlarmClock} tone="amber" loading={res.loading} />
      </section>

      <div className="toolbar">
        <Tabs label="Gate stage" value={tab} onChange={setTab} items={TABS.map((t) => ({ ...t, count: res.data ? mine.filter((p) => inTab(t.value, p)).length : undefined }))} />
        <SearchField value={q} onChange={setQ} placeholder="Student name, roll no. or destination" label="Search verified passes" />
      </div>

      {res.loading ? (
        <CardSkeleton count={6} />
      ) : res.error ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : mine.length === 0 ? (
        <EmptyState art="gate" title="You haven’t verified any passes yet" message="Passes you verify at the Gate Desk will be listed here." />
      ) : rows.length === 0 ? (
        <EmptyState art="search" icon={SearchX} title="Nothing in this view" compact />
      ) : (
        <div className="card-grid">
          {rows.map((p) => (
            <PassCard key={p.id} pass={p} hideId onOpen={setOpen} openLabel="View full details" />
          ))}
        </div>
      )}

      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title="Pass details" subtitle={open?.student?.name || 'Verified pass'}>
        {open && (
          <div className="stack-lg">
            <Notice tone="info" title="View only">To mark this student IN, ask for their pass ID and search it on the Gate Desk.</Notice>
            <PassDetails pass={open} hideId />
          </div>
        )}
      </Drawer>
    </div>
  );
}
