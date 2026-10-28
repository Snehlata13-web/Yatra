import { Link, useNavigate } from 'react-router-dom';
import { ClipboardCheck, LogOut, Wrench, Hourglass, ArrowRight, MapPin, Ticket, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useResource } from '../../hooks/useResource';
import { passApi, complaintApi, wardenApi } from '../../api/services';
import { StatCard, SectionHeader, Card, EmptyState, ErrorState, TableSkeleton, StatusBadge, CampusSkyline } from '../../components/ui';
import { CategoryTag } from '../../components/domain/Complaint';
import { greeting, formatDateTime, shortId, initials } from '../../utils/format';
import { StageState, ReturnTiming, returnTiming } from '../../components/domain/Pass';

export default function WardenOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const passes = useResource(passApi.all);
  const complaints = useResource(complaintApi.all);
  const registrations = useResource(wardenApi.pendingStudents);
  const pendingStudents = (registrations.data || []).length;
  const p = passes.data || [];
  const c = complaints.data || [];
  const pendingPasses = p.filter((x) => x.status === 'pending');
  const activeComplaints = c.filter((x) => ['pending', 'reopened', 'in_progress'].includes(x.status));
  const outside = p.filter((x) => x.status === 'approved' && x.currentStage === 'OUT')
    .sort((a, b) => new Date(a.returnTime) - new Date(b.returnTime));
  const notLeft = p.filter((x) => x.status === 'approved' && !x.currentStage)
    .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));
  const overdueCount = outside.filter((x) => returnTiming(x)?.status === 'overdue').length;

  const PassRow = ({ x, when }) => (
    <li>
      <Link to={`/warden/passes?tab=${x.currentStage === 'OUT' ? 'out' : 'not_left'}`} className="mini-list__row">
        <span className="avatar avatar--sm">{initials(x.student?.name)}</span>
        <span className="mini-list__main">
          <strong>{x.student?.name || shortId(x.id)} → {x.destination}</strong>
          <small>{[x.student?.roomNumber && `Room ${x.student.roomNumber}`, when].filter(Boolean).join(' · ')}</small>
        </span>
        {x.currentStage === 'OUT' ? (returnTiming(x) ? <ReturnTiming pass={x} /> : <StageState pass={x} />) : <StatusBadge status="not_left" size="sm" />}
      </Link>
    </li>
  );

  return (
    <div className="stack-xl">
      <section className="hero hero--slim">
        <div className="hero__pattern" aria-hidden />
        <div className="hero__content">
          <p className="eyebrow eyebrow--gold hero__eyebrow">{greeting()}, {(user.name || 'Warden').split(' ')[0]} <span className="hero__date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span></p>
          <h1 className="hero__title">Here’s what needs your attention.</h1>
          <p className="hero__text">Review outgoing passes and keep maintenance moving across the hostel.</p>
        </div>
        <CampusSkyline className="hero__skyline" />
      </section>

      {pendingStudents > 0 && (
        <Link to="/warden/students" className="callout">
          <span className="callout__icon"><UserCheck size={20} aria-hidden /></span>
          <span className="callout__text">
            <strong>{pendingStudents} student registration{pendingStudents > 1 ? 's' : ''} waiting for approval</strong>
            <small>Review roll number, course and room details before they can sign in.</small>
          </span>
          <ArrowRight size={18} aria-hidden />
        </Link>
      )}

      <section className="stat-grid" aria-label="Summary">
        <StatCard label="Pending pass approvals" value={pendingPasses.length} icon={ClipboardCheck} tone="amber" loading={passes.loading} onClick={() => navigate('/warden/passes')} />
        <StatCard label="Outside campus now" value={outside.length} icon={LogOut} tone="sage" loading={passes.loading} hint={overdueCount ? `${overdueCount} overdue` : `${notLeft.length} approved, not left yet`} onClick={() => navigate('/warden/passes?tab=out')} />
        <StatCard label="Pending complaints" value={c.filter((x) => x.status === 'pending' || x.status === 'reopened').length} art="complaints" icon={Wrench} tone="copper" loading={complaints.loading} onClick={() => navigate('/warden/complaints')} />
        <StatCard label="Awaiting student confirmation" value={c.filter((x) => x.status === 'awaiting_confirmation').length} icon={Hourglass} tone="brown" loading={complaints.loading} />
      </section>

      <div className="two-col">
        <Card padded={false}>
          <div className="card-pad">
            <SectionHeader title="Outside campus now" count={passes.data ? outside.length : undefined} action={<Link to="/warden/passes?tab=out" className="link-btn">View all <ArrowRight size={15} aria-hidden /></Link>} />
          </div>
          {passes.loading ? <TableSkeleton rows={3} cols={3} /> : passes.error ? <ErrorState compact error={passes.error} onRetry={passes.reload} /> : outside.length === 0 ? (
            <EmptyState compact art="gate" title="Everyone is inside" message="Students marked OUT at the gate appear here until they return." />
          ) : (
            <ul className="mini-list">
              {outside.slice(0, 5).map((x) => <PassRow key={x.id} x={x} when={x.gateOutAt ? `Left ${formatDateTime(x.gateOutAt)}` : `Due back ${formatDateTime(x.returnTime)}`} />)}
            </ul>
          )}
        </Card>

        <Card padded={false}>
          <div className="card-pad">
            <SectionHeader title="Approved · not left yet" count={passes.data ? notLeft.length : undefined} action={<Link to="/warden/passes?tab=not_left" className="link-btn">View all <ArrowRight size={15} aria-hidden /></Link>} />
          </div>
          {passes.loading ? <TableSkeleton rows={3} cols={3} /> : passes.error ? <ErrorState compact error={passes.error} onRetry={passes.reload} /> : notLeft.length === 0 ? (
            <EmptyState compact art="passes" title="No one waiting to leave" message="Approved passes appear here until the student is marked OUT." />
          ) : (
            <ul className="mini-list">
              {notLeft.slice(0, 5).map((x) => <PassRow key={x.id} x={x} when={`Leaves ${formatDateTime(x.departureTime)}`} />)}
            </ul>
          )}
        </Card>
      </div>

      <div className="two-col">
        <Card padded={false}>
          <div className="card-pad">
            <SectionHeader title="Passes to review" count={passes.data ? pendingPasses.length : undefined} action={<Link to="/warden/passes" className="link-btn">Open queue <ArrowRight size={15} aria-hidden /></Link>} />
          </div>
          {passes.loading ? <TableSkeleton rows={4} cols={3} /> : passes.error ? <ErrorState compact error={passes.error} onRetry={passes.reload} /> : pendingPasses.length === 0 ? (
            <EmptyState compact art="passes" icon={Ticket} title="Queue is clear" message="No passes are waiting for review." />
          ) : (
            <ul className="mini-list">
              {pendingPasses.slice(0, 5).map((x) => (
                <li key={x.id}>
                  <Link to="/warden/passes" className="mini-list__row">
                    <span className="mini-list__icon"><MapPin size={16} aria-hidden /></span>
                    <span className="mini-list__main"><strong>{x.student?.name ? `${x.student.name} → ${x.destination}` : x.destination}</strong><small>{[x.student?.rollNumber, x.student?.branch].filter(Boolean).join(' · ') || shortId(x.id)} · Leaves {formatDateTime(x.departureTime)}</small></span>
                    <StatusBadge status={x.status} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padded={false}>
          <div className="card-pad">
            <SectionHeader title="Active complaints" count={complaints.data ? activeComplaints.length : undefined} action={<Link to="/warden/complaints" className="link-btn">Open board <ArrowRight size={15} aria-hidden /></Link>} />
          </div>
          {complaints.loading ? <TableSkeleton rows={4} cols={3} /> : complaints.error ? <ErrorState compact error={complaints.error} onRetry={complaints.reload} /> : activeComplaints.length === 0 ? (
            <EmptyState compact art="complaints" icon={Wrench} title="All quiet" message="No complaints need action right now." />
          ) : (
            <ul className="mini-list">
              {activeComplaints.slice(0, 5).map((x) => (
                <li key={x.id}>
                  <Link to="/warden/complaints" className="mini-list__row">
                    <CategoryTag category={x.category} />
                    <span className="mini-list__main"><strong>Room {x.roomNumber ?? '—'} · Block {x.blockNumber ?? '—'}</strong><small>{x.title || x.description}</small></span>
                    <StatusBadge status={x.status} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
