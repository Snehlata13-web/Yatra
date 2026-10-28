import { AlertTriangle, RefreshCw, Inbox, Info, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Illustration } from './Illustration';

export function Spinner({ label = 'Loading', size = 22 }) {
  return (
    <span className="spinner" role="status">
      <Loader2 className="spin" size={size} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PageLoader({ label = 'Loading your workspace' }) {
  return (
    <div className="page-loader" role="status">
      <div className="page-loader__mark"><span /></div>
      <p>{label}…</p>
    </div>
  );
}

export function Skeleton({ width = '100%', height = 14, radius = 8, className = '' }) {
  return <span className={`skeleton ${className}`} style={{ width, height, borderRadius: radius }} aria-hidden />;
}

export function CardSkeleton({ count = 3, layout = 'grid' }) {
  return (
    <div className={layout === 'grid' ? 'card-grid' : 'stack'} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card skeleton-card" key={i}>
          <div className="row-between">
            <Skeleton width={90} height={12} />
            <Skeleton width={80} height={22} radius={99} />
          </div>
          <Skeleton width="70%" height={20} />
          <Skeleton width="95%" />
          <Skeleton width="60%" />
          <div className="row-between" style={{ marginTop: 8 }}>
            <Skeleton width="40%" height={36} radius={10} />
            <Skeleton width="40%" height={36} radius={10} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="table-skeleton" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div className="table-skeleton__row" key={r}>
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} width={c === 0 ? '60%' : '80%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, art, title, message, action, compact }) {
  return (
    <div className={`empty ${compact ? 'empty--compact' : ''} ${art ? 'empty--art' : ''}`}>
      {art ? (
        <div className="empty__ill"><Illustration name={art} size={compact ? 118 : 168} /></div>
      ) : (
        <div className="empty__art" aria-hidden>
          <span className="empty__ring" />
          <Icon size={compact ? 22 : 28} />
        </div>
      )}
      <h3 className="empty__title">{title}</h3>
      {message && <p className="empty__msg">{message}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'We couldn’t load this', compact }) {
  return (
    <div className={`empty empty--error empty--art ${compact ? 'empty--compact' : ''}`} role="alert">
      <div className="empty__ill"><Illustration name="error" size={compact ? 110 : 150} /></div>
      <h3 className="empty__title">{title}</h3>
      <p className="empty__msg">{error?.message || 'Something went wrong while contacting the server.'}</p>
      {onRetry && (
        <div className="empty__action">
          <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>Try again</Button>
        </div>
      )}
    </div>
  );
}

const NOTICE_ICON = { info: Info, success: CheckCircle2, error: XCircle, warning: AlertTriangle };

export function Notice({ tone = 'info', title, children, className = '' }) {
  const Icon = NOTICE_ICON[tone];
  return (
    <div className={`notice notice--${tone} ${className}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={18} className="notice__icon" aria-hidden />
      <div>
        {title && <strong className="notice__title">{title}</strong>}
        {children && <div className="notice__body">{children}</div>}
      </div>
    </div>
  );
}
