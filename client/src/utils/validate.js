export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

export const isPhone = (v) => /^\+?[1-9]\d{7,14}$/.test(String(v).replace(/[\s()-]/g, ''));

/**
 * validate(values, { field: [rule, rule] }) → { field: 'message' }
 * A rule is (value, values) => string | undefined
 */
export const validate = (values, schema) => {
  const errors = {};
  Object.entries(schema).forEach(([field, rules]) => {
    for (const rule of rules) {
      const msg = rule(values[field], values);
      if (msg) {
        errors[field] = msg;
        break;
      }
    }
  });
  return errors;
};

export const required = (label) => (v) => (String(v ?? '').trim() ? undefined : `${label} is required`);
export const minLen = (n, label) => (v) =>
  String(v ?? '').trim().length >= n ? undefined : `${label} must be at least ${n} characters`;
export const maxLen = (n, label) => (v) =>
  String(v ?? '').trim().length <= n ? undefined : `${label} must be ${n} characters or fewer`;
export const email = () => (v) => (isEmail(v) ? undefined : 'Enter a valid email address');
export const phone = () => (v) => (!v || isPhone(v) ? undefined : 'Enter a valid phone number');
