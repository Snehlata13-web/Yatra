import { API_CONFIG, ENDPOINTS } from '../config/api.config';
import { tokenStore } from './tokenStore';

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const listeners = new Set();
/** Subscribe to 401 responses (used by AuthContext to sign the user out). */
export const onUnauthorized = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const messageFrom = (data, status) => {
  if (data && typeof data === 'object') {
    const m = data.message || data.error || data.detail || data.msg;
    if (typeof m === 'string') return m;
  }
  if (typeof data === 'string' && data.length < 200) return data;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'The requested record was not found.';
  if (status === 429) return 'Too many requests. Please wait a few minutes and try again.';
  if (status >= 500) return 'The server ran into a problem. Please try again shortly.';
  return 'Request failed. Please try again.';
};

const resolve = (group, name) => {
  const ep = ENDPOINTS[group]?.[name];
  if (!ep) throw new Error(`Endpoint ENDPOINTS.${group}.${name} is not defined in api.config.js`);
  return ep;
};

/**
 * request('passes', 'create', { id, body, query })
 * Looks up the route in ENDPOINTS, attaches the bearer token and returns parsed JSON.
 */
export async function request(group, name, { id, body, query } = {}) {
  const ep = resolve(group, name);
  const token = tokenStore.get();

  const path = typeof ep.path === 'function' ? ep.path(encodeURIComponent(id)) : ep.path;
  const url = new URL(API_CONFIG.BASE_URL.replace(/\/+$/, '') + path);
  if (query) Object.entries(query).forEach(([k, v]) => v !== undefined && v !== '' && v !== null && url.searchParams.set(k, v));

  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, { method: ep.method, headers, body: payload, signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new ApiError('The server took too long to respond.', 0);
    throw new ApiError('Cannot reach the server. Check your connection or the API URL.', 0);
  }
  clearTimeout(timer);

  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    if (res.status === 401 && token) listeners.forEach((fn) => fn());
    if (res.status === 429) {
      const reset = Number(/t=(\d+)/.exec(res.headers.get('ratelimit') || '')?.[1]);
      const mins = Number.isFinite(reset) && reset > 0 ? Math.ceil(reset / 60) : null;
      throw new ApiError(
        `Too many requests from this network. Please try again${mins ? ` in about ${mins} minute${mins > 1 ? 's' : ''}` : ' in a few minutes'}.`,
        429,
        data,
      );
    }
    throw new ApiError(messageFrom(data, res.status), res.status, data);
  }
  return data;
}
