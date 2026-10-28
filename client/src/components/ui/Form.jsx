import { useId, useState } from 'react';
import { Eye, EyeOff, Search, X, ChevronDown, AlertCircle } from 'lucide-react';

function FieldShell({ id, label, hint, error, required, optional, children, className = '', counter }) {
  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="field__label">
          {label}
          {required && <span className="field__req" aria-hidden> *</span>}
          {optional && <span className="field__opt"> (optional)</span>}
        </label>
      )}
      {children}
      <div className="field__meta">
        {error ? (
          <p className="field__error" id={`${id}-error`} role="alert">
            <AlertCircle size={14} aria-hidden /> {error}
          </p>
        ) : hint ? (
          <p className="field__hint" id={`${id}-hint`}>{hint}</p>
        ) : <span />}
        {counter}
      </div>
    </div>
  );
}

const describedBy = (id, error, hint) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export function TextField({ label, hint, error, required, optional, icon: Icon, className, ...rest }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} optional={optional} className={className}>
      <div className={`input-wrap ${Icon ? 'has-icon' : ''}`}>
        {Icon && <Icon className="input-wrap__icon" size={18} aria-hidden />}
        <input
          id={id}
          className="input"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, error, hint)}
          aria-required={required || undefined}
          {...rest}
        />
      </div>
    </FieldShell>
  );
}

export function PasswordField({ label = 'Password', hint, error, required, icon: Icon, ...rest }) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <div className={`input-wrap has-action ${Icon ? 'has-icon' : ''}`}>
        {Icon && <Icon className="input-wrap__icon" size={18} aria-hidden />}
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="input"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, error, hint)}
          {...rest}
        />
        <button
          type="button"
          className="input-wrap__action"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </FieldShell>
  );
}

export function TextArea({ label, hint, error, required, maxLength, value = '', className, ...rest }) {
  const id = useId();
  const counter = maxLength ? (
    <span className={`field__counter ${value.length > maxLength * 0.9 ? 'is-near' : ''}`}>
      {value.length}/{maxLength}
    </span>
  ) : null;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} counter={counter} className={className}>
      <textarea
        id={id}
        className="input textarea"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, error, hint)}
        maxLength={maxLength}
        value={value}
        {...rest}
      />
    </FieldShell>
  );
}

export function SelectField({ label, hint, error, required, options = [], placeholder, className, ...rest }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div className="input-wrap select-wrap">
        <select id={id} className="input select" aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o;
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
        <ChevronDown className="select-wrap__chev" size={18} aria-hidden />
      </div>
    </FieldShell>
  );
}

export function SearchField({ value, onChange, placeholder = 'Search…', label = 'Search', className = '' }) {
  return (
    <div className={`search ${className}`}>
      <Search size={17} className="search__icon" aria-hidden />
      <input
        type="search"
        className="search__input"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" className="search__clear" onClick={() => onChange('')} aria-label="Clear search">
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options }) {
  const id = useId();
  return (
    <div className="filter">
      <label htmlFor={id} className="filter__label">{label}</label>
      <div className="filter__control">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="filter__select">
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={15} aria-hidden />
      </div>
    </div>
  );
}
