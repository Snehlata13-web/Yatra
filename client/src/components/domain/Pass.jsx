import { MapPin, CalendarClock, CalendarCheck2, ArrowRight, ChevronRight, DoorOpen } from 'lucide-react';
import { StatusBadge, DetailList } from '../ui';
import { formatDateTime, formatDay, formatTime, shortId, durationBetween, initials } from '../../utils/format';

/** Ordered pass journey: Submitted → Warden → Guard → OUT → IN */
export function passJourney(pass) {
  const rejected = pass.status === 'rejected';
  const approved = pass.status === 'approved';
  const verified = approved && (pass.guardVerified === true || Boolean(pass.currentStage));
  const out = verified && (pass.currentStage === 'OUT' || pass.currentStage === 'IN');
  const back = verified && pass.currentStage === 'IN';
  return [
    { key: 'submitted', label: 'Submitted', state: 'done' },
    { key: 'warden', label: rejected ? 'Rejected' : approved ? 'Warden approved' : 'Warden review', state: rejected ? 'failed' : approved ? 'done' : 'current' },
    { key: 'guard', label: 'Guard verified', state: rejected ? 'skipped' : verified ? 'done' : approved ? 'current' : 'upcoming' },
    { key: 'out', label: 'Left campus', time: out ? pass.gateOutAt : null, state: rejected ? 'skipped' : out ? 'done' : verified ? 'current' : 'upcoming' },
    { key: 'in', label: 'Returned', time: back ? pass.gateInAt : null, state: rejected ? 'skipped' : back ? 'done' : out ? 'current' : 'upcoming' },
  ];
}

export function Journey({ pass, compact }) {
  const steps = passJourney(pass);
  return (
    <ol className={`journey ${compact ? 'journey--compact' : ''}`} aria-label="Pass progress">
      {steps.map((s) => (
        <li key={s.key} className={`journey__step is-${s.state}`}>
          <span className="journey__dot" aria-hidden />
          <span className="journey__label">{s.label}</span>
         {s.time && !compact && (
            <span className="journey__time">
              <span>{formatDay(s.time)}</span>
              <span>{formatTime(s.time)}</span>
            </span>
          )}
          <span className="sr-only">{s.state}</span>
        </li>
      ))}
    </ol>
  );
}

export function GuardState({ pass }) {
  if (pass.status !== 'approved') return null;
  const verified = pass.guardVerified === true || Boolean(pass.currentStage);
  if (pass.guardVerified === null && !verified) return null;
  return <StatusBadge status={verified ? 'verified' : 'unverified'} size="sm" />;
}

export function StageState({ pass ,showTime = false }) {
  if (!pass.guardVerified && !pass.currentStage) return null;
  const at = pass.currentStage === 'OUT' ? pass.gateOutAt : pass.currentStage === 'IN' ? pass.gateInAt : null;
  return (
    <StatusBadge
      status={pass.currentStage || 'not_left'}
      size="sm"
      label={showTime && at ? `${pass.currentStage} · ${formatTime(at)}` : undefined}
    />
  );
}

/** On time / late / overdue, from the recorded gate times vs. the expected return. */
export function returnTiming(pass, now = Date.now()) {
  if (!pass.returnTime) return null;
  const due = new Date(pass.returnTime).getTime();
  if (pass.currentStage === 'IN' && pass.gateInAt) {
    const back = new Date(pass.gateInAt).getTime();
    return back > due
      ? { status: 'late', label: `Returned ${durationBetween(due, back)} late` }
      : { status: 'ontime', label: 'Returned on time' };
  }
  if (pass.currentStage === 'OUT' && now > due) {
    return { status: 'overdue', label: `Overdue by ${durationBetween(due, now)}` };
  }
  return null;
}

export function ReturnTiming({ pass }) {
  const t = returnTiming(pass);
  return t ? <StatusBadge status={t.status} size="sm" label={t.label} /> : null;
}

export function PassTimes({ pass }) {
  const dur = durationBetween(pass.departureTime, pass.returnTime);
  return (
    <div className="pass-times">
      <div className="pass-times__col">
        <span className="pass-times__k"><CalendarClock size={14} aria-hidden /> Departure</span>
        <strong>{formatDay(pass.departureTime)}</strong>
        <small>{formatTime(pass.departureTime)}</small>
      </div>
      <div className="pass-times__mid" aria-hidden>
        <span className="pass-times__line" />
        <ArrowRight size={14} />
        {dur && <small>{dur}</small>}
      </div>
      <div className="pass-times__col pass-times__col--end">
        <span className="pass-times__k"><CalendarCheck2 size={14} aria-hidden /> Return</span>
        <strong>{formatDay(pass.returnTime)}</strong>
        <small>{formatTime(pass.returnTime)}</small>
      </div>
    </div>
  );
}

const academicLine = (st) =>
  [st.course, st.branch, st.year && `Year ${st.year}`].filter(Boolean).join(' · ');

/** Who requested the pass — shown to wardens and guards. */
export function StudentStrip({ student }) {
  if (!student) return null;
  return (
    <div className="student-strip">
      <span className="avatar avatar--sm">{initials(student.name)}</span>
      <div className="student-strip__main">
        <strong>{student.name || 'Student'}</strong>
        <small>{[student.rollNumber, academicLine(student)].filter(Boolean).join(' · ') || '—'}</small>
      </div>
      {(student.roomNumber || student.blockNumber) && (
        <span className="student-strip__room"><DoorOpen size={13} aria-hidden /> {student.roomNumber ?? '—'}{student.blockNumber ? ` · ${student.blockNumber}` : ''}</span>
      )}
    </div>
  );
}

export function StudentDetails({ student }) {
  if (!student) return null;
  return (
    <DetailList
      items={[
        { label: 'Name', value: student.name },
        { label: 'Roll number', value: student.rollNumber },
        student.admissionNumber && { label: 'Admission no.', value: student.admissionNumber },
        { label: 'Course · Branch', value: [student.course, student.branch].filter(Boolean).join(' · ') || undefined },
        { label: 'Year · Batch', value: [student.year && `Year ${student.year}`, student.batch].filter(Boolean).join(' · ') || undefined },
        { label: 'Room · Block', value: [student.roomNumber, student.blockNumber].filter(Boolean).join(' · ') || undefined },
        student.phone && { label: 'Phone', value: <a href={`tel:${student.phone}`}>{student.phone}</a> },
        student.email && { label: 'Email', value: student.email },
      ]}
    />
  );
}

export function PassCard({ pass, onOpen, actions, showJourney = true, hideId = false, className = '', openLabel = 'View details' }) {
  return (
    <article className={`pass-card pass-card--${pass.status} ${className}`}>
      <div className="pass-card__top">
        <header className="pass-card__head">
          <span className="pass-card__id"><span className="pass-card__brand">YATRA PASS</span> {!hideId && shortId(pass.id)}</span>
          <StatusBadge status={pass.status} size="sm" />
        </header>
        <h3 className="pass-card__dest">
          <span className="pass-card__pin"><MapPin size={16} aria-hidden /></span>
          <span>{pass.destination || 'Destination not set'}</span>
        </h3>
        <p className="pass-card__reason">{pass.reason}</p>
        <StudentStrip student={pass.student} />
      </div>
      <div className="pass-card__tear" aria-hidden><span /><i /><span /></div>
      <div className="pass-card__bottom">
        <PassTimes pass={pass} />
        {(pass.guardVerified !== null || pass.currentStage) && pass.status === 'approved' && (
          <div className="pass-card__gate">
            <GuardState pass={pass} />
            <StageState pass={pass} />
          </div>
        )}
        {showJourney && <Journey pass={pass} compact />}
        {(onOpen || actions) && (
          <footer className="pass-card__foot">
            {onOpen && (
              <button type="button" className="link-btn" onClick={() => onOpen(pass)}>
                {openLabel} <ChevronRight size={15} aria-hidden />
              </button>
            )}
            {actions && <div className="pass-card__actions">{actions}</div>}
          </footer>
        )}
      </div>
    </article>
  );
}

export function PassDetails({ pass, hideId = false }) {
  return (
    <div className="stack-lg">
      <div className="pass-hero">
        <div className="row-between">
          <span className="pass-card__id">{hideId ? 'Yatra pass' : `Pass ${shortId(pass.id)}`}</span>
          <StatusBadge status={pass.status} />
        </div>
        <h3 className="pass-hero__dest"><MapPin size={20} aria-hidden /> {pass.destination}</h3>
        <PassTimes pass={pass} />
      </div>
      {pass.student && (
        <section>
          <h4 className="subhead">Student</h4>
          <StudentDetails student={pass.student} />
        </section>
      )}
      <section>
        <h4 className="subhead">Progress</h4>
        <Journey pass={pass} />
      </section>
      <section>
        <h4 className="subhead">Details</h4>
        <DetailList
          items={[
            !hideId && { label: 'Pass ID', value: String(pass.id ?? '—') },
            { label: 'Destination', value: pass.destination },
            { label: 'Reason', value: pass.reason },
            { label: 'Departure', value: formatDateTime(pass.departureTime) },
            { label: 'Expected return', value: formatDateTime(pass.returnTime) },
            { label: 'Warden status', value: <StatusBadge status={pass.status} size="sm" /> },
            pass.status === 'approved' && (pass.guardVerified !== null || pass.currentStage) && {
              label: 'Guard verification', value: <GuardState pass={pass} />,
            },
            (pass.guardVerified || pass.currentStage) && { label: 'Gate stage', value: <StageState pass={pass} showTime /> },
            pass.gateOutAt && { label: 'Left campus at', value: formatDateTime(pass.gateOutAt) },
            pass.gateInAt && { label: 'Returned at', value: formatDateTime(pass.gateInAt) },
            returnTiming(pass) && { label: 'Return', value: <ReturnTiming pass={pass} /> },
            pass.createdAt && { label: 'Requested on', value: formatDateTime(pass.createdAt) },
          ]}
        />
      </section>
    </div>
  );
}
