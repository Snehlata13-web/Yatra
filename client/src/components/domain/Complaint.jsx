import { Hammer, Zap, Droplets, CircleHelp, DoorOpen, Building2, CalendarDays } from 'lucide-react';
import { StatusBadge } from '../ui';
import { formatDate, shortId } from '../../utils/format';

export const CATEGORY_ICON = { Carpenter: Hammer, Electricity: Zap, Plumber: Droplets, Other: CircleHelp };

export function CategoryTag({ category }) {
  const Icon = CATEGORY_ICON[category] || CircleHelp;
  return (
    <span className={`cat cat--${String(category).toLowerCase()}`}>
      <Icon size={14} aria-hidden /> {category}
    </span>
  );
}

const FLOW = ['pending', 'in_progress', 'awaiting_confirmation', 'resolved'];
const FLOW_LABEL = { pending: 'Submitted', in_progress: 'In progress', awaiting_confirmation: 'Work done', resolved: 'Resolved' };

export function ComplaintProgress({ status }) {
  const effective = status === 'reopened' ? 'in_progress' : status;
  const idx = FLOW.indexOf(effective);
  return (
    <ol className="cprog" aria-label="Complaint progress">
      {FLOW.map((s, i) => (
        <li key={s} className={`cprog__step ${i < idx || status === 'resolved' ? 'is-done' : i === idx ? 'is-current' : ''}`}>
          <span className="cprog__bar" aria-hidden />
          <span className="cprog__label">{FLOW_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}

export function ComplaintCard({ complaint, children }) {
  return (
    <article className={`complaint-card complaint-card--${complaint.status}`}>
      <header className="complaint-card__head">
        <div className="complaint-card__tags">
          <span className="mono-id">{shortId(complaint.id)}</span>
          <CategoryTag category={complaint.category} />
        </div>
        <StatusBadge status={complaint.status} size="sm" />
      </header>
      <h3 className="complaint-card__title">{complaint.title || 'Untitled complaint'}</h3>
      <p className="complaint-card__desc">{complaint.description}</p>
      <ul className="meta-row">
        <li><DoorOpen size={14} aria-hidden /> Room {complaint.roomNumber ?? '—'}</li>
        <li><Building2 size={14} aria-hidden /> Block {complaint.blockNumber ?? '—'}</li>
        <li><CalendarDays size={14} aria-hidden /> {formatDate(complaint.createdAt)}</li>
      </ul>
      <ComplaintProgress status={complaint.status} />
      {children && <footer className="complaint-card__foot">{children}</footer>}
    </article>
  );
}
