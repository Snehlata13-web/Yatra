import { useLayoutEffect, useRef, useState } from 'react';

/** Accessible tabs with arrow-key navigation and a sliding indicator. items: [{ value, label, count }] */
export function Tabs({ items, value, onChange, label = 'Filter', className = '' }) {
  const refs = useRef([]);
  const wrap = useRef(null);
  const [ind, setInd] = useState(null);
  const activeIndex = items.findIndex((t) => t.value === value);

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[activeIndex];
      if (el) setInd({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro && wrap.current) ro.observe(wrap.current);
    return () => ro?.disconnect();
  }, [activeIndex, items.length, items.map((i) => i.count).join()]);

  const onKey = (e, i) => {
    let next = null;
    if (e.key === 'ArrowRight') next = (i + 1) % items.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + items.length) % items.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = items.length - 1;
    if (next !== null) {
      e.preventDefault();
      refs.current[next]?.focus();
      onChange(items[next].value);
    }
  };
  return (
    <div ref={wrap} className={`tabs ${className}`} role="tablist" aria-label={label}>
      {ind && <span className="tabs__indicator" style={{ transform: `translateX(${ind.x}px)`, width: ind.w }} aria-hidden />}
      {items.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={`tab ${active ? 'is-active' : ''}`}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.icon && <t.icon size={16} aria-hidden />}
            <span>{t.label}</span>
            {t.count !== undefined && <span className="tab__count">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Segmented selector (radio group look). */
export function Segmented({ options, value, onChange, name, label }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <label key={o.value} className={`segmented__opt ${active ? 'is-active' : ''}`}>
            <input type="radio" name={name} value={o.value} checked={active} onChange={() => onChange(o.value)} className="sr-only" />
            {o.icon && <span className="segmented__icon"><o.icon size={20} aria-hidden /></span>}
            <span className="segmented__text">
              <strong>{o.label}</strong>
              {o.description && <small>{o.description}</small>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
