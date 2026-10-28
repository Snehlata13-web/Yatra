import { useEffect, useRef, useState } from 'react';
import {
  ScanLine, Search, Hash, X, SearchX, LogOut, LogIn, ShieldCheck, ShieldAlert, CheckCircle2, MapPin,
  CalendarClock, CalendarCheck2, DoorOpen, ArrowRight, ChevronRight, IdCard, RotateCcw,
} from 'lucide-react';
import { passApi } from '../../api/services';
import { PageHeader, Button, EmptyState, ErrorState, Skeleton, Drawer, StatusBadge } from '../../components/ui';
import { PassDetails, ReturnTiming } from '../../components/domain/Pass';
import { nextGateAction, useGateActions } from './gate';
import { formatDay, formatTime, durationBetween, initials, shortId } from '../../utils/format';

/** What the guard should do with this pass right now. */
const gateState = (p) => {
  if (p.status === 'rejected') return { key: 'blocked', tone: 'red', title: 'Rejected by warden', hint: 'Do not allow exit.' };
  if (p.status !== 'approved') return { key: 'blocked', tone: 'red', title: 'Not approved yet', hint: 'The warden has not approved this pass. Do not allow exit.' };
  const next = nextGateAction(p);
  if (next === 'verify') return { key: 'leave', tone: 'copper', title: 'Ready to leave', hint: 'Check the college ID card, then let the student out.' };
  if (next === 'out') return { key: 'leave', tone: 'copper', title: 'Verified · ready to leave', hint: 'Check the college ID card, then mark OUT.' };
  if (next === 'in') return { key: 'return', tone: 'sage', title: 'Returning to hostel', hint: 'Student is outside campus. Check the ID card, then mark IN.' };
  return { key: 'done', tone: 'neutral', title: 'Trip completed', hint: 'This pass has already been used. A new pass is needed to leave again.' };
};

function GateCheck({ pass, onAction, onDetails }) {
  const st = gateState(pass);
  const next = nextGateAction(pass);
  const s = pass.student || {};
  const dur = durationBetween(pass.departureTime, pass.returnTime);

  return (
    <article className={`gate-check gate-check--${st.tone}`}>
      <header className="gate-check__head">
        <span className="gate-check__state">
          {st.key === 'blocked' ? <ShieldAlert size={18} aria-hidden /> : st.key === 'return' ? <LogIn size={18} aria-hidden /> : st.key === 'done' ? <CheckCircle2 size={18} aria-hidden /> : <LogOut size={18} aria-hidden />}
          {st.title}
        </span>
        <span className="gate-check__id">Pass {shortId(pass.id)}</span>
      </header>

      <div className="gate-check__body">
        <section className="gate-check__student">
          <span className="gate-check__avatar">{initials(s.name)}</span>
          <div className="gate-check__who">
            <strong>{s.name || 'Student'}</strong>
            <span className="gate-check__roll"><IdCard size={14} aria-hidden /> {s.rollNumber || '—'}</span>
            <small>{[s.course, s.branch, s.year && `Year ${s.year}`].filter(Boolean).join(' · ') || '—'}</small>
          </div>
          {(s.roomNumber || s.blockNumber) && (
            <span className="gate-check__room"><DoorOpen size={14} aria-hidden /> Room {s.roomNumber ?? '—'}{s.blockNumber ? ` · ${s.blockNumber}` : ''}</span>
          )}
        </section>

        <section className="gate-check__trip">
          <p className="gate-check__dest"><MapPin size={16} aria-hidden /> {pass.destination}</p>
          {pass.reason && <p className="gate-check__reason">{pass.reason}</p>}
          <div className="gate-check__times">
            <div><span><CalendarClock size={13} aria-hidden /> Leaves</span><strong>{formatDay(pass.departureTime)}</strong><small>{formatTime(pass.departureTime)}</small></div>
            <ArrowRight size={16} className="gate-check__arrow" aria-hidden />
            <div><span><CalendarCheck2 size={13} aria-hidden /> Returns by</span><strong>{formatDay(pass.returnTime)}</strong><small>{formatTime(pass.returnTime)}</small></div>
          </div>
          <div className="gate-check__tags">
            {dur && <span className="chip">{dur}</span>}
            {pass.gateOutAt && <StatusBadge status="OUT" size="sm" label={`Left ${formatDay(pass.gateOutAt)} · ${formatTime(pass.gateOutAt)}`} />}
            {pass.gateInAt && <StatusBadge status="IN" size="sm" label={`Back ${formatDay(pass.gateInAt)} · ${formatTime(pass.gateInAt)}`} />}
            <ReturnTiming pass={pass} />
          </div>
        </section>
      </div>

      <footer className="gate-check__foot">
        <p className="gate-check__hint">{st.hint}</p>
        <div className="gate-check__actions">
          <Button variant="text" iconRight={ChevronRight} onClick={() => onDetails(pass)}>Full details</Button>
          {next === 'verify' && (
            <>
              <Button variant="secondary" icon={ShieldCheck} onClick={() => onAction(pass, 'verify')}>Verify only</Button>
              <Button size="lg" icon={LogOut} onClick={() => onAction(pass, 'verifyOut')}>Verify &amp; mark OUT</Button>
            </>
          )}
          {next === 'out' && <Button size="lg" icon={LogOut} onClick={() => onAction(pass, 'out')}>Mark OUT</Button>}
          {next === 'in' && <Button size="lg" variant="success" icon={LogIn} onClick={() => onAction(pass, 'in')}>Mark IN</Button>}
        </div>
      </footer>
    </article>
  );
}

const DONE_COPY = {
  verifyOut: { icon: LogOut, verb: 'marked OUT', tone: 'copper' },
  out: { icon: LogOut, verb: 'marked OUT', tone: 'copper' },
  in: { icon: LogIn, verb: 'marked IN — back in the hostel', tone: 'sage' },
  verify: { icon: ShieldCheck, verb: 'verified — search again when they leave', tone: 'sage' },
};

function GateDone({ done, onNext }) {
  const c = DONE_COPY[done.kind];
  const Icon = c.icon;
  return (
    <div className={`gate-done gate-done--${c.tone}`} role="status">
      <span className="gate-done__icon"><CheckCircle2 size={30} aria-hidden /></span>
      <div className="gate-done__text">
        <strong>{done.name}</strong>
        <span><Icon size={15} aria-hidden /> {c.verb} at {formatTime(done.at)}</span>
      </div>
      <Button variant="secondary" icon={Search} onClick={onNext}>Next student</Button>
    </div>
  );
}

export default function GateDesk() {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ status: 'idle', pass: null, error: null, searched: '' });
  const [done, setDone] = useState(null); // last completed action, shown until the next search
  const [details, setDetails] = useState(null);

  const focusSearch = () => setTimeout(() => inputRef.current?.focus(), 30);

  const lookup = async (rawId) => {
    const id = String(rawId).trim().replace(/^#/, '');
    if (!id) { focusSearch(); return; }
    setDone(null);
    setState({ status: 'loading', pass: null, error: null, searched: id });
    try {
      const pass = await passApi.guardLookup(id);
      setState({ status: pass ? 'found' : 'missing', pass, error: null, searched: id });
    } catch (error) {
      setState({ status: 'error', pass: null, error, searched: id });
    }
  };

  const reset = () => {
    setQuery('');
    setState({ status: 'idle', pass: null, error: null, searched: '' });
    focusSearch();
  };

  // After an action the desk resets: the student must be searched again for the next step.
  const gate = useGateActions((pass, kind, saved) => {
    if (kind === 'partial') { lookup(pass.id); return; }
    const at = (kind === 'in' ? saved?.gate_in_at : saved?.gate_out_at) || new Date().toISOString();
    setDone({ kind, name: pass.student?.name || `Pass ${shortId(pass.id)}`, at });
    setQuery('');
    setState({ status: 'idle', pass: null, error: null, searched: '' });
    focusSearch();
  });

  useEffect(() => {
    const onKey = (e) => { if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); inputRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="stack-xl gate-desk">
      <PageHeader icon={ScanLine} eyebrow="Main gate" title="Gate Desk" description="One student at a time — search the pass ID, check the ID card, record OUT or IN." />

      <form className="gate-search2" onSubmit={(e) => { e.preventDefault(); lookup(query); }} role="search">
        <label htmlFor="gate-pass-id" className="gate-search2__label"><Hash size={16} aria-hidden /> Pass ID</label>
        <div className="gate-search2__row">
          <div className="gate-search2__field">
          <input
            id="gate-pass-id"
            ref={inputRef}
            className="gate-search2__input"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            placeholder="Enter pass ID"
            value={query}
            onChange={(e) => setQuery(e.target.value.replace(/[^\d#]/g, ''))}
          />
          {query && <button type="button" className="gate-search2__clear" onClick={reset} aria-label="Clear"><X size={16} /></button>}
          </div>
          <Button type="submit" size="lg" icon={Search} loading={state.status === 'loading'}>Look up</Button>
        </div>
        <p className="gate-search2__tip">Leaving or returning — always search first. Press <kbd>/</kbd> to jump here.</p>
      </form>

      {done && state.status === 'idle' && <GateDone done={done} onNext={reset} />}

      {state.status === 'idle' && !done && (
        <EmptyState art="gate" title="Waiting for a student" message="Ask for their pass ID and search it above. Passes are never listed here." />
      )}
      {state.status === 'loading' && (
        <div className="gate-check gate-check--loading">
          <Skeleton height={48} radius={0} />
          <div className="gate-check__body"><Skeleton height={120} radius={14} /><Skeleton height={120} radius={14} /></div>
        </div>
      )}
      {state.status === 'error' && <ErrorState error={state.error} onRetry={() => lookup(state.searched)} />}
      {state.status === 'missing' && (
        <EmptyState
          art="search"
          icon={SearchX}
          title={`No pass with ID #${state.searched}`}
          message="Check the number with the student. Do not allow exit without a valid pass."
          action={<Button variant="secondary" icon={RotateCcw} onClick={reset}>Search again</Button>}
        />
      )}
      {state.status === 'found' && state.pass && <GateCheck pass={state.pass} onAction={gate.open} onDetails={setDetails} />}

      {gate.modal}

      <Drawer open={Boolean(details)} onClose={() => setDetails(null)} title="Pass details" subtitle={details?.student?.name || 'Gate check'}>
        {details && <PassDetails pass={details} />}
      </Drawer>
    </div>
  );
}
