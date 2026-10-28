import { useId } from 'react';

export function Logo({ compact = false, tone = 'light' }) {
  const gid = `yatra-g-${useId().replace(/:/g, '')}`;
  return (
    <span className={`logo logo--${tone}`}>
      <svg className="logo__mark" viewBox="0 0 48 48" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6c449" />
            <stop offset="1" stopColor="#d27a2c" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="46" height="46" rx="13" fill="rgba(246,196,73,.12)" stroke={`url(#${gid})`} strokeWidth="1.5" />
        <path d="M14 14l10 12 10-12" fill="none" stroke={`url(#${gid})`} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 26v9" stroke={`url(#${gid})`} strokeWidth="4.5" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="logo__text">
          <strong>Yatra</strong>
          <small>Hostel Portal</small>
        </span>
      )}
    </span>
  );
}
