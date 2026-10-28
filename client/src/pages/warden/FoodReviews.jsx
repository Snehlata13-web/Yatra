import { useMemo, useState } from 'react';
import { UtensilsCrossed, CalendarDays, Coffee, Soup, Cookie, MoonStar, FilterX } from 'lucide-react';
import { useResource } from '../../hooks/useResource';
import { foodApi } from '../../api/services';
import { MEALS } from '../../config/app.config';
import { PageHeader, FilterSelect, Button, CardSkeleton, ErrorState, EmptyState, StatCard } from '../../components/ui';
import { todayISO, formatDate } from '../../utils/format';

const MEAL_ICON = { breakfast: Coffee, lunch: Soup, snacks: Cookie, dinner: MoonStar };

export default function WardenFoodReviews() {
  const [date, setDate] = useState(todayISO());
  const [meal, setMeal] = useState('');
  const res = useResource(() => foodApi.all({ date, meal }), [date, meal]);
  const reviews = res.data || [];
  const byMeal = useMemo(() => Object.fromEntries(MEALS.map((m) => [m.key, reviews.filter((r) => r.meal === m.key).length])), [reviews]);

  return (
    <div className="stack-xl">
      <PageHeader icon={UtensilsCrossed} eyebrow="Mess feedback" title="Food Reviews" description="What students are saying about each meal. Reviews are shown without student identity." onRefresh={res.refresh} refreshing={res.refreshing} />

      <div className="toolbar toolbar--filters">
        <div className="filter">
          <label className="filter__label" htmlFor="food-date">Date</label>
          <label className="date-bar__picker">
            <CalendarDays size={18} aria-hidden />
            <input id="food-date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        <FilterSelect label="Meal" value={meal} onChange={setMeal} options={[{ value: '', label: 'All meals' }, ...MEALS.map((m) => ({ value: m.key, label: m.label }))]} />
        {(meal || date !== todayISO()) && <Button variant="text" icon={FilterX} onClick={() => { setMeal(''); setDate(todayISO()); }}>Reset</Button>}
        <Button variant="text" onClick={() => setDate('')} disabled={!date}>All dates</Button>
      </div>

      <section className="stat-grid">
        {MEALS.map((m, i) => (
          <StatCard key={m.key} label={m.label} value={byMeal[m.key]} icon={MEAL_ICON[m.key]} tone={['amber', 'copper', 'brown', 'sage'][i]} loading={res.loading} hint={date ? formatDate(date) : 'All dates'} />
        ))}
      </section>

      {res.loading ? (
        <CardSkeleton count={4} />
      ) : res.error ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : reviews.length === 0 ? (
        <EmptyState art="food" title="No reviews for this selection" message="Try another date or meal." />
      ) : (
        <div className="card-grid">
          {reviews.map((r) => {
            const Icon = MEAL_ICON[r.meal] || UtensilsCrossed;
            const label = MEALS.find((m) => m.key === r.meal)?.label || r.meal;
            return (
              <article key={r.id} className={`meal meal--${r.meal} review-card`}>
                <header className="meal__head">
                  <span className="meal__icon"><Icon size={20} aria-hidden /></span>
                  <div><h3>{label}</h3><small>{formatDate(r.date)}</small></div>
                </header>
                <div className="meal__review"><blockquote>{r.review}</blockquote></div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
