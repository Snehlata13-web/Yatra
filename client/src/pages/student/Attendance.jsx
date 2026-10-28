import { useEffect, useState } from 'react';
import { CalendarCheck, Clock3, LogOut, CheckCircle2, XCircle, Fingerprint, MoonStar } from 'lucide-react';
import { useResource, useAction } from '../../hooks/useResource';
import { attendanceApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Button, Card, Notice, ErrorState, Skeleton, StatCard, StatusBadge } from '../../components/ui';
import { formatTime, formatDay, formatDateTime } from '../../utils/format';

/** Live "opens in / closes in" text from the server's window times. */
function useCountdown(win) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!win) return null;
  const skew = new Date(win.server_time).getTime() - (win.loadedAt || Date.now());
  const serverNow = now + skew;
  const opens = new Date(win.opens_at).getTime();
  const closes = new Date(win.closes_at).getTime();
  const left = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h ? `${h}h ${m}m` : `${m}m ${String(s % 60).padStart(2, '0')}s`;
  };
  if (serverNow < opens) return { phase: 'before', text: `Opens in ${left(opens - serverNow)}` };
  if (serverNow <= closes) return { phase: 'open', text: `Closes in ${left(closes - serverNow)}` };
  return { phase: 'closed', text: 'Closed for today' };
}

const STATE = {
  present: { icon: CheckCircle2, tone: 'sage', title: 'You’re marked present', sub: (d) => `Marked at ${formatTime(d.today.marked_at)} tonight.` },
  outside: { icon: LogOut, tone: 'copper', title: 'You’re outside campus', sub: (d) => `On pass #${d.today.pass?.id ?? d.currently_out?.id} — attendance isn’t needed while you’re away. Mark it once you’re back inside during the window.` },
  absent: { icon: XCircle, tone: 'red', title: 'Missed tonight’s attendance', sub: (d) => `It wasn’t marked between ${d.window.label}. Contact the warden if this is a mistake.` },
  pending: { icon: Clock3, tone: 'amber', title: 'Not marked yet', sub: (d) => `Mark your attendance from inside the hostel between ${d.window.label}.` },
};

export default function StudentAttendance() {
  const toast = useToast();
  const res = useResource(async () => ({ ...(await attendanceApi.mine(30)), loadedAt: Date.now() }));
  const mark = useAction(attendanceApi.mark);
  const data = res.data;
  const win = data && { ...data.window, loadedAt: data.loadedAt };
  const cd = useCountdown(win);

  // When the window opens or closes, reload so buttons/status match the server.
  const phase = cd?.phase;
  useEffect(() => { if (data && phase && phase !== (data.window.is_open ? 'open' : data.window.has_closed ? 'closed' : 'before')) res.refresh(); }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    try {
      await mark.run();
      toast.success('Attendance marked', 'You’re present for tonight.');
      res.refresh();
    } catch { /* shown inline */ }
  };

  const st = data ? STATE[data.today.status] || STATE.pending : null;
  const canMark = data?.can_mark && cd?.phase === 'open';

  return (
    <div className="stack-xl">
      <PageHeader icon={CalendarCheck} eyebrow="Night roll call" title="Attendance" description="Mark your presence every evening from inside the hostel." onRefresh={res.refresh} refreshing={res.refreshing} />

      {res.loading ? (
        <div className="att-hero"><Skeleton height={180} radius={24} /></div>
      ) : res.error ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : (
        <>
          <section className={`att-hero att-hero--${st.tone}`}>
            <div className="att-hero__clock" aria-hidden>
              <MoonStar size={26} />
              <strong>{data.window.label}</strong>
              <small>{cd?.text}</small>
            </div>
            <div className="att-hero__body">
              <span className="att-hero__state"><st.icon size={18} aria-hidden /> {st.title}</span>
              <p>{st.sub(data)}</p>
              {mark.error && <Notice tone="error" title="Couldn’t mark attendance">{mark.error.message}</Notice>}
              {data.today.status === 'pending' && (
                <Button size="lg" icon={Fingerprint} onClick={submit} loading={mark.pending} disabled={!canMark}>
                  {cd?.phase === 'before' ? `Opens at ${formatTime(data.window.opens_at)}` : 'Mark me present'}
                </Button>
              )}
            </div>
          </section>

          <section className="stat-grid stat-grid--3" aria-label="Last 30 days">
            <StatCard label="Present (30 days)" value={data.summary.present} icon={CheckCircle2} tone="sage" />
            <StatCard label="Absent" value={data.summary.absent} icon={XCircle} tone="brown" />
            <StatCard label="Away on pass" value={data.summary.outside} icon={LogOut} tone="copper" />
          </section>

          <Card>
            <h3 className="card-title">Last {data.history.length} days</h3>
            <ol className="att-strip" aria-label="Attendance history">
              {data.history.map((h) => (
                <li key={h.date} className={`att-day att-day--${h.status}`} title={`${formatDay(h.date)} · ${h.status}${h.marked_at ? ` · ${formatTime(h.marked_at)}` : ''}`}>
                  <span className="att-day__dow">{new Date(`${h.date}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                  <span className="att-day__num">{h.date.slice(8)}</span>
                  <span className="att-day__dot" aria-hidden />
                </li>
              ))}
            </ol>
            <ul className="att-list">
              {data.history.slice(0, 10).map((h) => (
                <li key={h.date}>
                  <span>{formatDay(h.date)}</span>
                  <span className="att-list__meta">{h.marked_at ? formatDateTime(h.marked_at) : h.pass ? `Pass #${h.pass.id} · ${h.pass.destination || ''}` : '—'}</span>
                  <StatusBadge status={h.status} size="sm" />
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
