import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { spawnRipple } from '../../hooks/useMotion';

/**
 * variant: primary | secondary | danger | danger-soft | success | glass | text
 * size: sm | md | lg
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, icon: Icon, iconRight: IconRight, block, className = '', children, disabled, type = 'button', onPointerDown, ...rest },
  ref,
) {
  const cls = ['btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', loading && 'is-loading', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      ref={ref}
      type={type}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onPointerDown={(e) => { spawnRipple(e); onPointerDown?.(e); }}
      {...rest}
    >
      {loading ? <Loader2 className="spin" size={size === 'sm' ? 15 : 18} aria-hidden /> : Icon && <Icon className="btn__icon" size={size === 'sm' ? 15 : 18} aria-hidden />}
      {children && <span>{children}</span>}
      {!loading && IconRight && <IconRight className="btn__icon-right" size={size === 'sm' ? 15 : 18} aria-hidden />}
    </button>
  );
});

export function IconButton({ label, icon: Icon, className = '', ...rest }) {
  return (
    <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} {...rest}>
      <Icon size={19} aria-hidden />
    </button>
  );
}
