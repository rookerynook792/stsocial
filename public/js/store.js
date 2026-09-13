'use strict';
// Global client state + tiny pub/sub + auth/theme persistence.

const listeners = new Set();

function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

export const store = {
  token: load('sttoken', null),
  user: load('stuser', null),
  theme: load('sttheme', null),
  meta: null,
  unread: 0,

  get isAuthed() { return !!this.token; },
  get isAdmin() { return !!(this.user && this.user.role === 'admin'); },

  setToken(t) { this.token = t; if (t) save('sttoken', t); else save('sttoken', null); },
  setUser(u) { this.user = u; save('stuser', u); },

  setTheme(t) {
    this.theme = t;
    save('sttheme', t);
    document.documentElement.setAttribute('data-theme', t);
    this.notify('theme');
  },
  toggleTheme() { this.setTheme(this.theme === 'dark' ? 'light' : 'dark'); },
  initTheme() {
    if (!this.theme) this.theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.theme);
  },

  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  notify(evt) { listeners.forEach((fn) => { try { fn(evt); } catch { /* ignore */ } }); },
};
