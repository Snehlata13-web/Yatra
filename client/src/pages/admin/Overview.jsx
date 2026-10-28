import { Link, useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, Ticket, LogOut, AlarmClock, Wrench, Hourglass, UtensilsCrossed, Megaphone, ArrowRight, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useResource } from '../../hooks/useResource';
import { wardenApi, adminApi, passApi, complaintApi, foodApi, noticeApi } from '../../api/services';
import { MEALS, ROLE_LABEL } from '../../config/app.config';
import { StatCard, SectionHeader, Card, EmptyState, ErrorState, TableSkeleton, StatusBadge, CampusSkyline } from '../../components/ui';
import { CategoryTag } from '../../components/domain/Complaint';
import { returnTiming, ReturnTiming } from '../../components/domain/Pass';
import { greeting, formatDateTime, formatDate, todayISO, initials, shortId } from '../../utils/format';

/** Small panel with its own loading / error / empty state. */
function Panel({ title, count, to, res, empty, children }) {
  return (
    <Card padded={false}>
      <div className="card-pad">
        <SectionHeader title={title} count={res.data ? count : undefined} action={<Link to={to} className="link-btn">Open <ArrowRight size={15} aria-hidden /></Link>} />
      </div>
      {res.loading ? <TableSkeleton rows={3} cols={3} />
        : res.error ? <ErrorState compact error={res.error} onRetry={res.reload} />
          : count === 0 ? <EmptyState compact art={empty.art} title={empty.title} message={empty.message} />
            : <ul className="mini-list">{children}</ul>}
    </Card>
  );
}

export default function AdminOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const students = useResource(wardenApi.students);
  const staff = useResource(adminApi.pending);
  const passes = useResource(passApi.all);
  const complaints = useResource(complaintApi.all);
  const food = useResource(() => foodApi.all({ date: todayISO() }));
  const notices = useResource(noticeApi.list);

  const st = students.data || [];
  const p = passes.data || [];
  const c = complaints.data || [];
  const f = food.data || [];
  const n = notices.data || [];

  const pendingStudents = st.filter((a) => a.approvalStatus === 'pending');
  const staffPending = staff.data || [];
  const outside = p.filter((x) => x.status === 'approved' && x.currentStage === 'OUT')
    .sort((a, b) => new Date(a.returnTime) - new Date(b.returnTime));
  const overdue = outside.filter((x) => returnTiming(x)?.status === 'overdue');
  const openComplaints = c.filter((x) => ['pending', 'in_progress', 'reopened'].includes(x.status));

  return (
    <div className="stack-xl">
      <section className="hero hero--slim">
        <div className="hero__pattern" aria-hidden />
        <div className="hero__content">
          <p className="eyebrow eyebrow--gold hero__eyebrow">{greeting()}, {(user.name || 'Admin').split(' ')[0]} <span className="hero__date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span></p>
          <h1 className="hero__title">The whole hostel, at a glance.</h1>
          <p className="hero__text">Residents, passes, gate movement, maintenance, meals and notices — everything happening in Yatra.</p>
        </div>
        <CampusSkyline className="hero__skyline" />
      </section>

      {(staffPending.length > 0 || pendingStudents.length > 0) && (
        <div className="stack">
          {staffPending.length > 0 && (
            <Link to="/admin/accounts" className="callout">
              <span className="callout__icon"><ShieldCheck size={20} aria-hidden /></span>
              <span className="callout__text">
                <strong>{staffPending.length} staff account{staffPending.length > 1 ? 's' : ''} waiting for your approval</strong>
                <small>{staffPending.slice(0, 3).map((a) => `${a.name} (${ROLE_LABEL[a.role]})`).join(', ')}</small>
              </span>
              <ArrowRight size={18} aria-hidden />
            </Link>
          )}
          {pendingStudents.length > 0 && (
            <Link to="/admin/students" className="callout">
              <span className="callout__icon"><UserCheck size={20} aria-hidden /></span>
              <span className="callout__text">
                <strong>{pendingStudents.length} student registration{pendingStudents.length > 1 ? 's' : ''} pending</strong>
                <small>Usually approved by the warden — you can approve them too.</small>
              </span>
              <ArrowRight size={18} aria-hidden />
            </Link>
          )}
        </div>
      )}

      <section className="stat-grid" aria-label="Residents and passes">
        <StatCard label="Total students" value={st.length} icon={Users} tone="copper" loading={students.loading} hint={`${pendingStudents.length} pending approval`} onClick={() => navigate('/admin/students')} />
        <StatCard label="Pass requests" value={p.length} icon={Ticket} tone="amber" loading={passes.loading} hint={`${p.filter((x) => x.status === 'pending').length} waiting for warden`} onClick={() => navigate('/admin/passes')} />
        <StatCard label="Outside campus now" value={outside.length} icon={LogOut} tone="sage" loading={passes.loading} hint={`${p.filter((x) => x.status === 'approved' && !x.currentStage).length} approved, not left yet`} onClick={() => navigate('/admin/passes?tab=out')} />
        <StatCard label="Overdue returns" value={overdue.length} icon={AlarmClock} tone="brown" loading={passes.loading} hint="Past expected return, still out" onClick={() => navigate('/admin/passes?tab=out')} />
      </section>

      <section className="stat-grid" aria-label="Hostel life">
        <StatCard label="Open complaints" value={openComplaints.length} icon={Wrench} tone="copper" loading={complaints.loading} hint={`${c.length} total`} onClick={() => navigate('/admin/complaints')} />
        <StatCard label="Awaiting student confirmation" value={c.filter((x) => x.status === 'awaiting_confirmation').length} icon={Hourglass} tone="amber" loading={complaints.loading} onClick={() => navigate('/admin/complaints')} />
        <StatCard label="Food reviews today" value={f.length} icon={UtensilsCrossed} tone="sage" loading={food.loading} hint={MEALS.map((m) => `${m.label[0]}${f.filter((r) => r.meal === m.key).length}`).join(' · ')} onClick={() => navigate('/admin/food')} />
        <StatCard label="Notices published" value={notices.error ? '—' : n.length} icon={Megaphone} tone="brown" loading={notices.loading} hint={n[0] ? `Latest ${formatDate(n[0].createdAt)}` : undefined} onClick={() => navigate('/admin/notices')} />
      </section>

      <div className="two-col">
        <Panel title="Outside campus now" count={outside.length} to="/admin/passes?tab=out" res={passes} empty={{ art: 'gate', title: 'Everyone is inside', message: 'Students marked OUT at the gate appear here.' }}>
          {outside.slice(0, 5).map((x) => (
            <li key={x.id}>
              <Link to="/admin/passes?tab=out" className="mini-list__row">
                <span className="avatar avatar--sm">{initials(x.student?.name)}</span>
                <span className="mini-list__main">
                  <strong>{x.student?.name || shortId(x.id)} → {x.destination}</strong>
                  <small>{x.gateOutAt ? `Left ${formatDateTime(x.gateOutAt)}` : `Due back ${formatDateTime(x.returnTime)}`}</small>
                </span>
                {returnTiming(x) ? <ReturnTiming pass={x} /> : <StatusBadge status="OUT" size="sm" />}
              </Link>
            </li>
          ))}
        </Panel>

        <Panel title="Open complaints" count={openComplaints.length} to="/admin/complaints" res={complaints} empty={{ art: 'complaints', title: 'All quiet', message: 'No complaints need action right now.' }}>
          {openComplaints.slice(0, 5).map((x) => (
            <li key={x.id}>
              <Link to="/admin/complaints" className="mini-list__row">
                <CategoryTag category={x.category} />
                <span className="mini-list__main"><strong>Room {x.roomNumber ?? '—'} · Block {x.blockNumber ?? '—'}</strong><small>{x.title || x.description}</small></span>
                <StatusBadge status={x.status} size="sm" />
              </Link>
            </li>
          ))}
        </Panel>
      </div>

      <div className="two-col">
        <Panel title="Today’s food reviews" count={f.length} to="/admin/food" res={food} empty={{ art: 'food', title: 'No reviews yet today', message: 'Student meal reviews for today appear here.' }}>
          {f.slice(0, 5).map((r) => (
            <li key={r.id}>
              <Link to="/admin/food" className="mini-list__row">
                <span className="mini-list__icon"><UtensilsCrossed size={16} aria-hidden /></span>
                <span className="mini-list__main"><strong>{MEALS.find((m) => m.key === r.meal)?.label || r.meal}</strong><small>{r.review}</small></span>
              </Link>
            </li>
          ))}
        </Panel>

        <Panel title="Latest notices" count={n.length} to="/admin/notices" res={notices} empty={{ art: 'helpdesk', title: 'No notices yet', message: 'Warden announcements appear here.' }}>
          {n.slice(0, 5).map((x) => (
            <li key={x.id}>
              <Link to="/admin/notices" className="mini-list__row">
                <span className="mini-list__icon"><Megaphone size={16} aria-hidden /></span>
                <span className="mini-list__main"><strong>{x.title}</strong><small>{formatDate(x.createdAt)} · {x.body}</small></span>
              </Link>
            </li>
          ))}
        </Panel>
      </div>
    </div>
  );
}
