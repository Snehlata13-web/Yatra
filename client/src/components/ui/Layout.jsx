import { RefreshCw, ChevronRight } from 'lucide-react';
import { Skeleton } from './Feedback';
import { Button } from './Button';
import { useCountUp } from '../../hooks/useMotion';

export function StatCard({ label, value, icon: Icon, tone = 'copper', hint, loading, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  const shown = useCountUp(loading ? 0 : value);
  return (
    <Tag type={onClick ? 'button' : undefined} className={`stat stat--${tone} ${onClick ? 'is-clickable' : ''}`} onClick={onClick}>
      <div className="stat__top">
        <span className="stat__label">{label}</span>
        {Icon && <span className="stat__icon" aria-hidden><Icon size={18} /></span>}
      </div>
      <div className="stat__value" aria-live="polite">{loading ? <Skeleton width={56} height={34} /> : shown ?? '—'}</div>
      {Icon && <Icon className="stat__watermark" size={92} aria-hidden />}
      {onClick && <span className="stat__go" aria-hidden><ChevronRight size={16} /></span>}
      {hint && <p className="stat__hint">{hint}</p>}
    </Tag>
  );
}

export function PageHeader({ eyebrow, title, description, actions, onRefresh, refreshing, icon: Icon }) {
  return (
    <header className={`page-head ${Icon ? 'page-head--icon' : ''}`}>
      {Icon && (
        <span className="page-head__tile" aria-hidden>
          <Icon size={26} />
        </span>
      )}
      <div className="page-head__text">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-head__title">{title}</h1>
        {description && <p className="page-head__desc">{description}</p>}
      </div>
      {(actions || onRefresh) && (
        <div className="page-head__actions">
          {onRefresh && (
            <Button variant="secondary" icon={RefreshCw} onClick={onRefresh} disabled={refreshing} className={refreshing ? 'is-refreshing' : ''}>
              {refreshing ? 'Refreshing' : 'Refresh'}
            </Button>
          )}
          {actions}
        </div>
      )}
    </header>
  );
}

export function SectionHeader({ title, action, count }) {
  return (
    <div className="section-head">
      <h2 className="section-head__title">
        {title}
        {count !== undefined && <span className="section-head__count">{count}</span>}
      </h2>
      {action}
    </div>
  );
}

export function Card({ children, className = '', padded = true, ...rest }) {
  return <section className={`card ${padded ? '' : 'card--flush'} ${className}`} {...rest}>{children}</section>;
}

export function DetailList({ items }) {
  return (
    <dl className="detail-list">
      {items.filter(Boolean).map((it, i) => (
        <div className="detail-list__row" key={typeof it.label === 'string' ? it.label : i}>
          <dt>{it.label}</dt>
          <dd>{it.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
