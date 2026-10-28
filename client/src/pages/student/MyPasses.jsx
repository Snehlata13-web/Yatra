import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Ticket, PlusCircle, SearchX } from 'lucide-react';
import { useResource } from '../../hooks/useResource';
import { passApi } from '../../api/services';
import { PageHeader, Tabs, SearchField, CardSkeleton, ErrorState, EmptyState, Button, Drawer } from '../../components/ui';
import { PassCard, PassDetails } from '../../components/domain/Pass';

const TABS = ['all', 'pending', 'approved', 'rejected'];
const LABEL = { all: 'All', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

export default function MyPasses() {
  const navigate = useNavigate();
  const location = useLocation();
  const res = useResource(passApi.mine);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(location.state?.open ?? null);

  useEffect(() => {
    if (location.state?.open) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const passes = res.data || [];
  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t, t === 'all' ? passes.length : passes.filter((p) => p.status === t).length])), [passes]);
  const filtered = passes.filter((p) => {
    if (tab !== 'all' && p.status !== tab) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return [p.id, p.destination, p.reason].some((v) => String(v ?? '').toLowerCase().includes(s));
  });
  const open = passes.find((p) => String(p.id) === String(openId));

  return (
    <div className="stack-xl">
      <PageHeader icon={Ticket}
        eyebrow="Passes"
        title="My Passes"
        description="Track every request from warden review to gate check-in."
        onRefresh={res.refresh}
        refreshing={res.refreshing}
        actions={<Button icon={PlusCircle} onClick={() => navigate('/student/passes/new')}>Request a Pass</Button>}
      />

      <div className="toolbar">
        <Tabs label="Pass status" value={tab} onChange={setTab} items={TABS.map((t) => ({ value: t, label: LABEL[t], count: res.data ? counts[t] : undefined }))} />
        <SearchField value={q} onChange={setQ} placeholder="Search by ID, destination, reason" label="Search passes" />
      </div>

      {res.loading ? (
        <CardSkeleton count={6} />
      ) : res.error ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : passes.length === 0 ? (
        <EmptyState
          art="passes"
          icon={Ticket}
          title="You haven’t requested a pass yet"
          message="Submit a request and it will appear here with live approval and gate status."
          action={<Button icon={PlusCircle} onClick={() => navigate('/student/passes/new')}>Request a Pass</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState art="search" icon={SearchX} title="No matching passes" message="Try a different status tab or clear your search." action={<Button variant="secondary" onClick={() => { setQ(''); setTab('all'); }}>Clear filters</Button>} />
      ) : (
        <div className="card-grid">
          {filtered.map((p) => <PassCard key={p.id} pass={p} onOpen={() => setOpenId(p.id)} />)}
        </div>
      )}

      <Drawer open={Boolean(open)} onClose={() => setOpenId(null)} title="Pass details" subtitle={open?.destination}>
        {open && <PassDetails pass={open} />}
      </Drawer>
    </div>
  );
}
