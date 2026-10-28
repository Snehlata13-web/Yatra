import { API_CONFIG } from '../config/api.config';

const store = () => (API_CONFIG.TOKEN_STORAGE === 'local' ? window.localStorage : window.sessionStorage);

/** The bearer token only lives here and in the Authorization header — never in React state or the DOM. */
export const tokenStore = {
  get() {
    try { return store().getItem(API_CONFIG.TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { store().setItem(API_CONFIG.TOKEN_KEY, token); } catch { /* storage unavailable */ }
  },
  clear() {
    try { store().removeItem(API_CONFIG.TOKEN_KEY); } catch { /* storage unavailable */ }
  },
};
