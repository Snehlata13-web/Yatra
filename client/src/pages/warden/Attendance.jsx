import { useMemo, useState } from 'react';
import { CalendarCheck, CalendarDays, CheckCircle2, Clock3, XCircle, LogOut, Users, SearchX, Phone } from 'lucide-react';
import { useResource } from '../../hooks/useResource';
import { attendanceApi } from '../../api/services';
import { PageHeader, Card, TableSkeleton, ErrorState, EmptyState, StatCard, StatusBadge, Tabs, SearchField, Notice, FilterSelect } from '../../components/ui';
import { formatTime, formatDate, todayISO, initials, formatDateTime } from '../../utils/format';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'present', label: 'Present', icon: CheckCircle2 },
  { value: 'pending', label: 'Pending', icon: Clock3 },
  { value: 'absent', label: 'Absent', icon: XCircle },
  { value: 'outside', label: 'Outside on pass', icon: LogOut },
];
const ORDER = { absent: 0, pending: 1, outside: 2, present: 3 };

export default function WardenAttendance() {
  const [date, setDate] = useState(todayISO());
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [block, setBlock] = useState('');
  const res = useResource(() => attendanceApi.day(date), [date]);
  const data = res.data;
  const all = data?.students || [];
  const blocks = useMemo(() => [...new Set(all.map((r) => r.student.blockNumber).filter(Boolean))].sort(), [all]);
  const scoped = all.filter((r) => !block || r.student.blockNumber === block);
  const count = (s) => scoped.filter((r) => s === 'all' || r.status === s).length;
  const rows = scoped
    .filter((r) => tab === 'all' || r.status === tab)
    .filter((r) => !q.trim() || [r.student.name, r.student.rollNumber, r.student.roomNumber].some((v) => String(v ?? '').toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || String(a.student.roomNumber).localeCompare(String(b.student.roomNumber), undefined, { numeric: true }));
  const isToday = date === todayISO();
  const present = count('present');
  const expected = scoped.length - count('outside');

  return (
    <div className="stack-xl">
      <PageHeader icon={CalendarCheck} eyebrow="Night roll call" title="Attendance" description={data ? `Students mark themselves present between ${data.window.label}. Students OUT on a pass are excused automatically.` : 'Nightly hostel attendance.'} onRefresh={res.refresh} refreshing={res.refreshing} />

      <div className="toolbar toolbar--filters">
        <div className="filter">
          <label className="filter__label" htmlFor="att-date">Date</label>
          <label className="date-bar__picker">
            <CalendarDays size={18} aria-hidden />
            <input id="att-date" type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </label>
        </div>
        {blocks.length > 1 && <FilterSelect label="Block" value={block} onChange={setBlock} options={[{ value: '', label: 'All blocks' }, ...blocks.map((b) => ({ value: b, label: `Block ${b}` }))]} />}
      </div>

      {data && isToday && !data.window.has_closed && (
        <Notice tone={data.window.is_open ? 'warning' : 'info'} title={data.window.is_open ? 'Attendance window is open now' : `Opens at ${formatTime(data.window.opens_at)}`}>
          {data.window.is_open
            ? `Pending students can still mark until ${formatTime(data.window.closes_at)}. Anyone not marked by then becomes absent.`
            : `Students can mark between ${data.window.label}. Everyone is pending until then.`}
        </Notice>
      )}

      <section className="stat-grid att-stats" aria-label="Summary">
        <StatCard label="Present" value={present} icon={CheckCircle2} tone="sage" loading={res.loading} hint={expected > 0 ? `${Math.round((present / expected) * 100)}% of students inside` : undefined} onClick={() => setTab('present')} />
        <StatCard label={isToday && !data?.window.has_closed ? 'Pending' : 'Absent'} value={isToday && !data?.window.has_closed ? count('pending') : count('absent')} icon={isToday && !data?.window.has_closed ? Clock3 : XCircle} tone={isToday && !data?.window.has_closed ? 'amber' : 'brown'} loading={res.loading} onClick={() => setTab(isToday && !data?.window.has_closed ? 'pending' : 'absent')} />
        <StatCard label="Outside on pass" value={count('outside')} icon={LogOut} tone="copper" loading={res.loading} hint="Excused — OUT at the gate" onClick={() => setTab('outside')} />
        <StatCard label="Total residents" value={scoped.length} icon={Users} tone="amber" loading={res.loading} hint={formatDate(date)} onClick={() => setTab('all')} />
      </section>

      <div className="toolbar">
        <Tabs label="Attendance status" value={tab} onChange={setTab} items={TABS.map((t) => ({ ...t, count: data ? count(t.value) : undefined }))} />
        <SearchField value={q} onChange={setQ} placeholder="Name, roll no. or room" label="Search students" />
      </div>

      <Card padded={false}>
        {res.loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : res.error ? (
          <ErrorState error={res.error} onRetry={res.reload} />
        ) : all.length === 0 ? (
          <EmptyState art="approvals" title="No approved students" message="Approved residents appear here for nightly attendance." />
        ) : rows.length === 0 ? (
          <EmptyState art="search" icon={SearchX} title="Nobody in this view" compact />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Roll number</th>
                  <th scope="col">Room</th>
                  <th scope="col">Status</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.studentId} className={r.status === 'absent' ? 'is-flagged' : ''}>
                    <td data-label="Student">
                      <span className="person">
                        <span className="avatar avatar--sm">{initials(r.student.name)}</span>
                        <span className="td-person"><strong>{r.student.name || '—'}</strong><small className="td-sub">{[r.student.course, r.student.branch, r.student.year && `Y${r.student.year}`].filter(Boolean).join(' · ')}</small></span>
                      </span>
                    </td>
                    <td data-label="Roll number"><span className="mono-id">{r.student.rollNumber || '—'}</span></td>
                    <td data-label="Room">{r.student.roomNumber ?? '—'}{r.student.blockNumber && <small className="td-sub">Block {r.student.blockNumber}</small>}</td>
                    <td data-label="Status"><StatusBadge status={r.status} size="sm" /></td>
                    <td data-label="Details">
                      {r.status === 'present' && <span>Marked {formatTime(r.markedAt)}</span>}
                      {r.status === 'outside' && <span>Pass #{r.pass?.id}{r.pass?.destination ? ` → ${r.pass.destination}` : ''}{r.pass?.gate_out_at && <small className="td-sub">Left {formatDateTime(r.pass.gate_out_at)}</small>}</span>}
                      {(r.status === 'absent' || r.status === 'pending') && (r.student.phone
                        ? <a href={`tel:${r.student.phone}`} className="link-btn"><Phone size={14} aria-hidden /> {r.student.phone}</a>
                        : <span className="muted-sm">—</span>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
