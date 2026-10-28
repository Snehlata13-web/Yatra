import { useNavigate, Link } from 'react-router-dom';
import { Ticket, Hourglass, CheckCircle2, Wrench, PlusCircle, UtensilsCrossed, ArrowRight, MessageSquarePlus, MapPinned, CalendarCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useResource } from '../../hooks/useResource';
import { passApi, complaintApi, attendanceApi } from '../../api/services';
import { StatCard, SectionHeader, EmptyState, ErrorState, CardSkeleton, Button, CampusSkyline } from '../../components/ui';
import { PassCard } from '../../components/domain/Pass';
import { ComplaintCard } from '../../components/domain/Complaint';
import { greeting } from '../../utils/format';

export default function StudentOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const passes = useResource(passApi.mine);
  const complaints = useResource(complaintApi.mine);
  const attendance = useResource(() => attendanceApi.mine(1));
  const att = attendance.data;
  const showAttendance = att && att.today.status === 'pending' && !att.window.has_closed;

  const p = passes.data || [];
  const c = complaints.data || [];
  const openComplaints = c.filter((x) => x.status !== 'resolved');
  const firstName = (user.name || '').split(' ')[0];

  return (
    <div className="stack-xl">
      <section className="hero">
        <div className="hero__pattern" aria-hidden />
        <div className="hero__content">
          <p className="eyebrow eyebrow--gold hero__eyebrow">{greeting()} <span className="hero__date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span></p>
          <h1 className="hero__title">Welcome home, {firstName || 'there'}.</h1>
          <p className="hero__text">Plan outings, raise maintenance requests and share meal feedback — all in one calm place.</p>
          <div className="hero__actions">
            <Button icon={PlusCircle} onClick={() => navigate('/student/passes/new')}>Request a Pass</Button>
            <Button variant="glass" icon={MessageSquarePlus} onClick={() => navigate('/student/complaints', { state: { compose: true } })}>New Complaint</Button>
            <Button variant="glass" icon={UtensilsCrossed} onClick={() => navigate('/student/food')}>Add Food Review</Button>
          </div>
        </div>
        <CampusSkyline className="hero__skyline" />
      </section>

      {showAttendance && (
        <Link to="/student/attendance" className={`callout ${att.window.is_open ? '' : 'callout--quiet'}`}>
          <span className="callout__icon"><CalendarCheck size={20} aria-hidden /></span>
          <span className="callout__text">
            <strong>{att.window.is_open ? 'Night attendance is open — mark it now' : `Tonight’s attendance: ${att.window.label}`}</strong>
            <small>{att.window.is_open ? 'Mark yourself present from inside the hostel before the window closes.' : 'Come back during the window to mark yourself present.'}</small>
          </span>
          <ArrowRight size={18} aria-hidden />
        </Link>
      )}

      <section className="stat-grid" aria-label="Summary">
        <StatCard label="Total pass requests" value={p.length} icon={Ticket} tone="copper" loading={passes.loading} onClick={() => navigate('/student/passes')} />
        <StatCard label="Pending warden review" value={p.filter((x) => x.status === 'pending').length} icon={Hourglass} tone="amber" loading={passes.loading} />
        <StatCard label="Approved passes" value={p.filter((x) => x.status === 'approved').length} icon={CheckCircle2} tone="sage" loading={passes.loading} />
        <StatCard label="Open complaints" value={openComplaints.length} art="complaints" icon={Wrench} tone="brown" loading={complaints.loading} onClick={() => navigate('/student/complaints')} />
      </section>

      <section>
        <SectionHeader
          title="Recent passes"
          action={p.length > 0 && <Link className="link-btn" to="/student/passes">View all <ArrowRight size={15} aria-hidden /></Link>}
        />
        {passes.loading ? (
          <CardSkeleton count={3} />
        ) : passes.error ? (
          <ErrorState error={passes.error} onRetry={passes.reload} compact />
        ) : p.length === 0 ? (
          <EmptyState
            art="passes"
            icon={Ticket}
            title="No pass requests yet"
            message="When you plan time away from the hostel, your requests and their approval progress will appear here."
            action={<Button icon={PlusCircle} onClick={() => navigate('/student/passes/new')}>Request your first pass</Button>}
          />
        ) : (
          <div className="card-grid">
            {p.slice(0, 3).map((pass) => (
              <PassCard key={pass.id} pass={pass} onOpen={() => navigate('/student/passes', { state: { open: pass.id } })} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title="Open complaints"
          action={c.length > 0 && <Link className="link-btn" to="/student/complaints">View all <ArrowRight size={15} aria-hidden /></Link>}
        />
        {complaints.loading ? (
          <CardSkeleton count={2} />
        ) : complaints.error ? (
          <ErrorState error={complaints.error} onRetry={complaints.reload} compact />
        ) : openComplaints.length === 0 ? (
          <EmptyState compact art="complaints" icon={Wrench} title="Nothing needs fixing" message="You have no open maintenance complaints." />
        ) : (
          <div className="card-grid">
            {openComplaints.slice(0, 3).map((x) => <ComplaintCard key={x.id} complaint={x} />)}
          </div>
        )}
      </section>
    </div>
  );
}
