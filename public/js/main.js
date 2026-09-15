'use strict';
import { store } from './store.js';
import { api } from './api.js';
import { h, toast, sheet } from './ui.js';
import { navigate, NAV, updateUnreadBadge } from './router.js';

store.initTheme();

/* ------------------------------ build nav ------------------------------- */
function buildNav() {
  const nav = document.getElementById('bottom-nav');
  nav.innerHTML = '';
  for (const item of NAV) {
    nav.append(h('a', { class: 'nav-item', href: item.hash, 'data-tab': item.id, 'aria-label': item.label },
      h('span', { class: 'nav-ico', text: item.ico }),
      h('span', { text: item.label }),
    ));
  }
}

/* --------------------------------- FAB ---------------------------------- */
function wireFab() {
  const fab = document.getElementById('fab');
  fab.addEventListener('click', () => {
    if (!store.isAuthed) { window.location.hash = '#/auth'; return; }
    sheet({
      title: 'Create',
      body: h('div', { class: 'stack' },
        h('a', { class: 'btn btn-ghost', style: { width: '100%' }, href: '#/compose/post' }, h('span', { text: '💬 Post to Forum' })),
        h('a', { class: 'btn btn-ghost', style: { width: '100%' }, href: '#/compose/event' }, h('span', { text: '📣 Announce an Event' })),
      ),
    });
  });
}

/* -------------------------------- back ---------------------------------- */
function wireBack() {
  document.getElementById('back-btn').addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.location.hash = '#/home';
  });
}

/* ----------------------------- demo banner ------------------------------ */
function initBanner() {
  const banner = document.getElementById('demo-banner');
  if (!store.meta || !store.meta.demoMode) { banner.hidden = true; return; }
  if (localStorage.getItem('stbanner-dismissed')) { banner.hidden = true; return; }
  banner.hidden = false;
  document.getElementById('demo-banner-close').addEventListener('click', () => {
    banner.hidden = true;
    localStorage.setItem('stbanner-dismissed', '1');
  });
}

/* --------------------------- refresh meta -------------------------------- */
async function loadMeta() {
  try {
    store.meta = await api.get('/api/meta');
  } catch { store.meta = { demoMode: false }; }
}

/* --------------------- notifications polling ----------------------------- */
async function pollUnread() {
  if (!store.isAuthed) return;
  try {
    const out = await api.get('/api/notifications');
    store.unread = out.unread;
    updateUnreadBadge();
  } catch { /* ignore */ }
}
function startPoll() {
  pollUnread();
  setInterval(pollUnread, 45000);
}

/* ------------------------------- theme ----------------------------------- */
function wireThemeButton() {
  // header theme buttons are re-rendered by the router; keep icon in sync
  const apply = () => {
    document.querySelectorAll('[aria-label="Theme"]').forEach((b) => (b.textContent = store.theme === 'dark' ? '☀️' : '🌙'));
  };
  store.subscribe((evt) => { if (evt === 'theme') apply(); });
}

/* -------------------------------- boot ----------------------------------- */
async function boot() {
  buildNav();
  wireFab();
  wireBack();
  wireThemeButton();
  await loadMeta();
  initBanner();
  if (store.isAuthed) {
    try { const me = await api.get('/api/auth/me'); store.setUser(me.user); }
    catch { store.setToken(null); store.setUser(null); }
  }
  navigate();
  startPoll();
}

boot();

// PWA: register the service worker (app shell + offline).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

export { toast };
