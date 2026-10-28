import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, MapPin, FileText, Send, Info, CalendarClock, CalendarCheck2, MapPinned } from 'lucide-react';
import { Button, TextField, TextArea, Notice, Segmented, PageHeader, Card } from '../../components/ui';
import { passApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { validate, required, minLen, maxLen } from '../../utils/validate';
import { toLocalInput, toISO, durationBetween, isSameLocalDay, formatDateTime } from '../../utils/format';

const MODES = [
  { value: 'short', label: 'Short Pass', description: 'Same-day outing', icon: Sun },
  { value: 'long', label: 'Long Pass', description: 'Overnight / multi-day', icon: Moon },
];

const defaults = (mode) => {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  start.setMinutes(0, 0, 0);
  const end = new Date(start);
  if (mode === 'short') end.setHours(Math.min(start.getHours() + 4, 21));
  else { end.setDate(end.getDate() + 2); end.setHours(18); }
  return { departure: toLocalInput(start), returnAt: toLocalInput(end) };
};

export default function RequestPass() {
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState('short');
  const [values, setValues] = useState({ destination: '', reason: '', ...defaults('short') });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const switchMode = (m) => {
    setMode(m);
    setValues((v) => ({ ...v, ...defaults(m) }));
    setErrors({});
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(values, {
      destination: [required('Destination'), minLen(2, 'Destination'), maxLen(120, 'Destination')],
      reason: [required('Reason'), minLen(5, 'Reason'), maxLen(500, 'Reason')],
      departure: [
        required('Departure date & time'),
        (v) => (new Date(v) < new Date(Date.now() - 5 * 60 * 1000) ? 'Departure cannot be in the past' : undefined),
      ],
      returnAt: [
        required('Expected return'),
        (v, all) => (new Date(v) <= new Date(all.departure) ? 'Return must be after departure' : undefined),
        (v, all) => (mode === 'short' && !isSameLocalDay(v, all.departure) ? 'A short pass must return the same day — switch to Long Pass' : undefined),
      ],
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setServerError('');
    try {
      await passApi.create({
        destination: values.destination.trim(),
        reason: values.reason.trim(),
        departureTime: toISO(values.departure),
        returnTime: toISO(values.returnAt),
      });
      toast.success('Pass request submitted', 'Your warden will review it shortly.');
      navigate('/student/passes');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const duration = durationBetween(values.departure, values.returnAt);

  return (
    <div className="stack-xl">
      <PageHeader icon={MapPinned} eyebrow="New request" title="Plan your time away" description="Tell your warden where you’re going and when you’ll be back." />

      <div className="split">
        <Card className="split__main">
          <form className="form" onSubmit={submit} noValidate>
            <fieldset className="fieldset">
              <legend className="field__label">Pass type</legend>
              <Segmented name="mode" label="Pass type" options={MODES} value={mode} onChange={switchMode} />
            </fieldset>

            {serverError && <Notice tone="error" title="Couldn’t submit request">{serverError}</Notice>}

            <TextField label="Destination" icon={MapPin} placeholder={mode === 'short' ? 'e.g. Pari Chowk market' : 'e.g. Home — Lucknow'} value={values.destination} onChange={set('destination')} error={errors.destination} maxLength={120} required />
            <TextArea label="Reason" placeholder="Briefly explain the purpose of your outing" rows={4} value={values.reason} onChange={set('reason')} error={errors.reason} maxLength={500} required />

            <div className="form-row">
              <TextField label="Departure" type="datetime-local" icon={CalendarClock} value={values.departure} onChange={set('departure')} error={errors.departure} required />
              <TextField label="Expected return" type="datetime-local" icon={CalendarCheck2} value={values.returnAt} onChange={set('returnAt')} error={errors.returnAt} min={values.departure} required />
            </div>

            <div className="form-actions form-actions--sticky">
              <Button variant="secondary" onClick={() => navigate(-1)} disabled={loading}>Cancel</Button>
              <Button type="submit" icon={Send} loading={loading}>{loading ? 'Submitting' : 'Submit request'}</Button>
            </div>
          </form>
        </Card>

        <aside className="split__side stack">
          <Card className="summary-card">
            <p className="eyebrow">Summary</p>
            <h3 className="summary-card__title">{values.destination || 'Your destination'}</h3>
            <ul className="summary-card__list">
              <li><span>Type</span><strong>{mode === 'short' ? 'Short · same day' : 'Long · overnight'}</strong></li>
              <li><span>Leaves</span><strong>{values.departure ? formatDateTime(values.departure) : '—'}</strong></li>
              <li><span>Returns</span><strong>{values.returnAt ? formatDateTime(values.returnAt) : '—'}</strong></li>
              <li><span>Duration</span><strong>{duration || '—'}</strong></li>
            </ul>
          </Card>
          <Card className="process">
            <p className="process__title"><Info size={16} aria-hidden /> How approval works</p>
            <ol className="process__steps">
              <li><span>1</span><div><strong>You submit</strong><small>Request goes to the warden queue.</small></div></li>
              <li><span>2</span><div><strong>Warden reviews</strong><small>Approves or rejects your pass.</small></div></li>
              <li><span>3</span><div><strong>Guard verifies</strong><small>Gate staff verify and record OUT / IN.</small></div></li>
            </ol>
          </Card>
          <p className="fine-print"><FileText size={14} aria-hidden /> Short/Long is a planning aid only; the request stores destination, reason and times.</p>
        </aside>
      </div>
    </div>
  );
}
