import {
  Clock3, CheckCircle2, XCircle, AlarmClock, Hammer, Hourglass, BadgeCheck, RotateCcw, LogOut, LogIn, ShieldCheck, ShieldQuestion,
} from 'lucide-react';

const MAP = {
  pending: { label: 'Pending', tone: 'amber', icon: Clock3 },
  approved: { label: 'Approved', tone: 'sage', icon: CheckCircle2 },
  rejected: { label: 'Rejected', tone: 'red', icon: XCircle },
  in_progress: { label: 'In Progress', tone: 'blue', icon: Hammer },
  awaiting_confirmation: { label: 'Awaiting Confirmation', tone: 'gold', icon: Hourglass },
  resolved: { label: 'Resolved', tone: 'sage', icon: BadgeCheck },
  reopened: { label: 'Reopened', tone: 'plum', icon: RotateCcw },
  OUT: { label: 'OUT', tone: 'copper', icon: LogOut },
  IN: { label: 'IN', tone: 'sage', icon: LogIn },
  verified: { label: 'Guard Verified', tone: 'sage', icon: ShieldCheck },
  unverified: { label: 'Awaiting Guard', tone: 'neutral', icon: ShieldQuestion },
  not_left: { label: 'Not left yet', tone: 'neutral', icon: Clock3 },
  present: { label: 'Present', tone: 'sage', icon: CheckCircle2 },
  absent: { label: 'Absent', tone: 'red', icon: XCircle },
  outside: { label: 'Outside on pass', tone: 'copper', icon: LogOut },
  ontime: { label: 'On time', tone: 'sage', icon: CheckCircle2 },
  late: { label: 'Returned late', tone: 'red', icon: AlarmClock },
  overdue: { label: 'Overdue', tone: 'red', icon: AlarmClock },
};

export function StatusBadge({ status, label, size = 'md' }) {
  const meta = MAP[status] || { label: status, tone: 'neutral' };
  const Icon = meta.icon;
  return (
    <span className={`badge badge--${meta.tone} badge--${size}`}>
      {Icon && <Icon size={size === 'sm' ? 12 : 14} aria-hidden />}
      {label || meta.label}
    </span>
  );
}

export const statusLabel = (status) => MAP[status]?.label || status;

export function Chip({ children, tone = 'neutral' }) {
  return <span className={`chip chip--${tone}`}>{children}</span>;
}
