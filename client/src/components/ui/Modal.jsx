import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, HelpCircle } from 'lucide-react';
import { Button, IconButton } from './Button';
import { Notice } from './Feedback';
import { usePresence, useLatchedValue } from '../../hooks/useMotion';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function useDialog(open, onClose, ref) {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    document.body.classList.add('no-scroll');
    const node = ref.current;
    const t = setTimeout(() => {
      const target = node?.querySelector('[data-autofocus]') || node?.querySelectorAll(FOCUSABLE)[0];
      target?.focus();
    }, 30);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab' && node) {
        const items = [...node.querySelectorAll(FOCUSABLE)];
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      previous?.focus?.();
    };
  }, [open, onClose, ref]);
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md', dismissible = true }) {
  const ref = useRef(null);
  const { mounted, closing } = usePresence(open, 220);
  const view = useLatchedValue({ title, description, children, footer }, open);
  useDialog(open, dismissible ? onClose : undefined, ref);
  if (!mounted) return null;
  return createPortal(
    <div className={`overlay ${closing ? 'is-closing' : ''}`} onMouseDown={(e) => dismissible && !closing && e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal__head">
          <div>
            <h2 id="modal-title" className="modal__title">{view.title}</h2>
            {view.description && <p className="modal__desc">{view.description}</p>}
          </div>
          {dismissible && <IconButton icon={X} label="Close dialog" onClick={onClose} />}
        </header>
        {view.children && <div className="modal__body">{view.children}</div>}
        {view.footer && <footer className="modal__foot">{view.footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

/** Confirmation dialog — stays open with an inline error if the API call fails. */
export function ConfirmModal({
  open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', tone = 'primary', loading, error, children,
}) {
  const Icon = tone === 'danger' ? AlertTriangle : HelpCircle;
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      dismissible={!loading}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={tone} onClick={onConfirm} loading={loading} data-autofocus>{confirmLabel}</Button>
        </>
      }
    >
      <div className={`confirm confirm--${tone}`}>
        <span className="confirm__icon" aria-hidden><Icon size={22} /></span>
        <div className="confirm__text">
          {message && <p>{message}</p>}
          {children}
        </div>
      </div>
      {error && <Notice tone="error" title="Action failed" className="mt-16">{error.message}</Notice>}
    </Modal>
  );
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 520 }) {
  const ref = useRef(null);
  const { mounted, closing } = usePresence(open, 300);
  const view = useLatchedValue({ title, subtitle, children, footer }, open);
  useDialog(open, onClose, ref);
  if (!mounted) return null;
  return createPortal(
    <div className={`overlay overlay--drawer ${closing ? 'is-closing' : ''}`} onMouseDown={(e) => !closing && e.target === e.currentTarget && onClose?.()}>
      <aside ref={ref} className="drawer" style={{ '--drawer-w': `${width}px` }} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header className="drawer__head">
          <div>
            {view.subtitle && <p className="eyebrow">{view.subtitle}</p>}
            <h2 id="drawer-title" className="drawer__title">{view.title}</h2>
          </div>
          <IconButton icon={X} label="Close panel" onClick={onClose} />
        </header>
        <div className="drawer__body">{view.children}</div>
        {view.footer && <footer className="drawer__foot">{view.footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}
