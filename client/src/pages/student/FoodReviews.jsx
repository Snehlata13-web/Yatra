import { useEffect, useState } from 'react';
import { Coffee, Soup, Cookie, MoonStar, CheckCircle2, PencilLine, Send, CalendarDays, ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { useResource } from '../../hooks/useResource';
import { foodApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { MEALS } from '../../config/app.config';
import { PageHeader, Button, TextArea, Notice, ErrorState, Skeleton, Chip } from '../../components/ui';
import { todayISO, formatDate } from '../../utils/format';
import { validate, required, minLen, maxLen } from '../../utils/validate';

const MEAL_ICON = { breakfast: Coffee, lunch: Soup, snacks: Cookie, dinner: MoonStar };

const shiftDate = (iso, days) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

function MealCard({ meal, date, existing, onSaved }) {
  const toast = useToast();
  const [editing, setEditing] = useState(!existing);
  const [text, setText] = useState(existing?.review || '');
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const Icon = MEAL_ICON[meal.key];

  useEffect(() => {
    setEditing(!existing);
    setText(existing?.review || '');
    setError('');
    setServerError('');
  }, [existing, date]);

  const save = async () => {
    const errs = validate({ text }, { text: [required('Review'), minLen(5, 'Review'), maxLen(600, 'Review')] });
    setError(errs.text || '');
    if (errs.text) return;
    setLoading(true);
    setServerError('');
    try {
      if (existing) await foodApi.update(existing.id, { review: text.trim(), meal: meal.key, date });
      else await foodApi.create({ meal: meal.key, date, review: text.trim() });
      toast.success(existing ? `${meal.label} review updated` : `${meal.label} review submitted`);
      onSaved();
    } catch (err) {
      setServerError(err.status === 409 ? `You’ve already reviewed ${meal.label.toLowerCase()} for this date. Refresh to edit it.` : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className={`meal meal--${meal.key} ${existing ? 'is-done' : ''}`}>
      <header className="meal__head">
        <span className="meal__icon"><Icon size={22} aria-hidden /></span>
        <div>
          <h3>{meal.label}</h3>
          <small>{meal.time}</small>
        </div>
        {existing ? <Chip tone="sage"><CheckCircle2 size={13} aria-hidden /> Submitted</Chip> : <Chip>Not reviewed</Chip>}
      </header>

      {serverError && <Notice tone="error">{serverError}</Notice>}

      {editing ? (
        <div className="meal__form">
          <TextArea
            label={`Your ${meal.label.toLowerCase()} review`}
            rows={4}
            placeholder="How was the taste, quantity, temperature and hygiene?"
            value={text}
            onChange={(e) => { setText(e.target.value); setError(''); }}
            error={error}
            maxLength={600}
          />
          <div className="meal__actions">
            {existing && <Button variant="text" onClick={() => { setEditing(false); setText(existing.review); setError(''); }} disabled={loading}>Cancel</Button>}
            <Button icon={Send} onClick={save} loading={loading}>{existing ? 'Save changes' : 'Submit review'}</Button>
          </div>
        </div>
      ) : (
        <div className="meal__review">
          <blockquote>{existing.review}</blockquote>
          <Button variant="secondary" size="sm" icon={PencilLine} onClick={() => setEditing(true)}>Edit review</Button>
        </div>
      )}
    </article>
  );
}

export default function FoodReviews() {
  const [date, setDate] = useState(todayISO());
  const res = useResource(foodApi.mine);
  const reviews = res.data || [];
  const today = todayISO();
  const submitted = MEALS.filter((m) => reviews.some((r) => r.meal === m.key && r.date === date)).length;

  return (
    <div className="stack-xl">
      <PageHeader icon={UtensilsCrossed} eyebrow="Mess feedback" title="Food Reviews" description="Share honest feedback for each meal. One review per meal, per day." onRefresh={res.refresh} refreshing={res.refreshing} />

      <div className="date-bar">
        <div className="date-bar__nav">
          <button type="button" className="icon-btn" onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day"><ChevronLeft size={19} /></button>
          <label className="date-bar__picker">
            <CalendarDays size={18} aria-hidden />
            <span className="sr-only">Review date</span>
            <input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </label>
          <button type="button" className="icon-btn" onClick={() => setDate(shiftDate(date, 1))} disabled={date >= today} aria-label="Next day"><ChevronRight size={19} /></button>
        </div>
        <div className="date-bar__meta">
          <strong>{date === today ? 'Today' : formatDate(date)}</strong>
          <div className="meter" aria-label={`${submitted} of 4 meals reviewed`}>
            {MEALS.map((m, i) => <span key={m.key} className={i < submitted ? 'is-on' : ''} />)}
          </div>
          <small>{res.loading ? 'Loading…' : `${submitted} of 4 reviewed`}</small>
        </div>
      </div>

      {res.loading ? (
        <div className="meal-grid">
          {MEALS.map((m) => (
            <div className="meal" key={m.key}>
              <Skeleton width="50%" height={22} />
              <Skeleton height={96} radius={12} />
              <Skeleton width={120} height={38} radius={10} />
            </div>
          ))}
        </div>
      ) : res.error ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : (
        <div className="meal-grid">
          {MEALS.map((m) => (
            <MealCard
              key={`${m.key}-${date}`}
              meal={m}
              date={date}
              existing={reviews.find((r) => r.meal === m.key && r.date === date)}
              onSaved={res.refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
