import { useEffect, useRef, useState } from 'react';

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Keeps an element mounted while its exit animation plays.
 * Returns { mounted, closing }.
 */
export function usePresence(open, duration = 260) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return undefined;
    }
    if (!mounted) return undefined;
    setClosing(true);
    const t = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, reduced() ? 0 : duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { mounted, closing };
}

/** Remembers the last value seen while `active` was true (so closing dialogs keep their content). */
export function useLatchedValue(value, active) {
  const ref = useRef(value);
  if (active) ref.current = value;
  return ref.current;
}

/** Animated number that counts from its previous value to the new one. */
export function useCountUp(target, duration = 900) {
  const isNum = typeof target === 'number' && Number.isFinite(target);
  const [display, setDisplay] = useState(isNum ? 0 : target);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!isNum) {
      setDisplay(target);
      return undefined;
    }
    if (reduced()) {
      setDisplay(target);
      fromRef.current = target;
      return undefined;
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplay(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, isNum, duration]);

  return display;
}

/** Material-style ripple: call from onPointerDown. */
export function spawnRipple(e) {
  if (reduced()) return;
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const span = document.createElement('span');
  span.className = 'ripple';
  span.style.width = span.style.height = `${size}px`;
  span.style.left = `${e.clientX - rect.left - size / 2}px`;
  span.style.top = `${e.clientY - rect.top - size / 2}px`;
  el.appendChild(span);
  span.addEventListener('animationend', () => span.remove(), { once: true });
}
