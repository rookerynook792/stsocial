'use strict';
import { store } from './store.js';
import { h } from './ui.js';
import * as Home from './views/home.js';
import * as Events from './views/events.js';
import * as EventDetail from './views/event.js';
import * as Explore from './views/explore.js';
import * as Gallery from './views/gallery.js';
import * as Forum from './views/forum.js';
import * as PostDetail from './views/post.js';
import * as ComposePost from './views/compose-post.js';
import * as ComposeEvent from './views/compose-event.js';
import * as Town from './views/town.js';
import * as PlaceDetail from './views/place.js';
import * as University from './views/university.js';
import * as Profile from './views/profile.js';
import * as Search from './views/search.js';
import * as Notifications from './views/notifications.js';
import * as Admin from './views/admin.js';
import * as MapView from './views/map.js';
import * as Settings from './views/settings.js';
import * as Auth from './views/auth.js';

export const NAV = [
  { id: 'home', label: 'Home', ico: '🏠', hash: '#/home' },
  { id: 'events', label: 'Events', ico: '📅', hash: '#/events' },
  { id: 'guide', label: 'Guide', ico: '🧭', hash: '#/explore' },
  { id: 'gallery', label: 'Gallery', ico: '📸', hash: '#/gallery' },
  { id: 'forum', label: 'Forum', ico: '💬', hash: '#/forum' },
  { id: 'town', label: 'Town', ico: '🏘️', hash: '#/town' },
  { id: 'profile', label: 'Profile', ico: '👤', hash: '#/profile' },
];

// route table — order matters (first match wins)
const ROUTES = [
  { m: /^\/?$/, view: Home, tab: 'home', title: 'SAINT SOCIAL', home: true },
  { m: /^\/home\/?$/, view: Home, tab: 'home', title: 'SAINT SOCIAL', home: true },
  { m: /^\/events\/?$/, view: Events, tab: 'events', title: 'Events' },
  { m: /^\/events?\//, view: EventDetail, tab: 'events', back: true, title: 'Event' },
  { m: /^\/explore\/?$/, view: Explore, tab: 'guide', title: 'Explore St Andrews' },
  { m: /^\/gallery\/?$/, view: Gallery, tab: 'gallery', title: 'Gallery' },
  { m: /^\/forum\/?$/, view: Forum, tab: 'forum', title: 'Forum' },
  { m: /^\/post\//, view: PostDetail, tab: 'forum', back: true, title: 'Discussion' },
  { m: /^\/compose\/post/, view: ComposePost, back: true, title: 'New Post', auth: true },
  { m: /^\/compose\/event/, view: ComposeEvent, back: true, title: 'Announce an Event', auth: true },
  { m: /^\/town\/?$/, view: Town, tab: 'town', title: 'St Andrews Town' },
  { m: /^\/place\//, view: PlaceDetail, tab: 'town', back: true, title: 'Place' },
  { m: /^\/university\/?$/, view: University, tab: 'town', back: true, title: 'University Updates' },
  { m: /^\/map\/?$/, view: MapView, tab: 'town', back: true, title: 'St Andrews Map' },
  { m: /^\/search\/?$/, view: Search, back: true, title: 'Search' },
  { m: /^\/notifications\/?$/, view: Notifications, back: true, title: 'Notifications', auth: true },
  { m: /^\/profile\/?$/, view: Profile, tab: 'profile', title: 'Profile', auth: true },
  { m: /^\/profile\//, view: Profile, tab: 'profile', back: true, title: 'Profile' },
  { m: /^\/settings\/?$/, view: Settings, back: true, title: 'Settings', auth: true },
  { m: /^\/admin\/?$/, view: Admin, back: true, title: 'Admin', auth: true, admin: true },
  { m: /^\/auth\/?$/, view: Auth, title: 'Sign in' },
];

let current = null;

function parse() {
  const raw = (window.location.hash || '#/').replace(/^#/, '');
  const path = raw.split('?')[0];
  const query = Object.fromEntries(new URLSearchParams(raw.split('?')[1] || ''));
  const route = ROUTES.find((r) => r.m.test(path)) || ROUTES[0];
  const segs = path.split('/').filter(Boolean);
  const id = segs[1] ? decodeURIComponent(segs[1]) : null;
  return { route, path, query, id };
}

function renderHeader(route, ctx) {
  const title = document.getElementById('ah-title');
  const back = document.getElementById('back-btn');
  const actions = document.getElementById('ah-actions');
  back.hidden = !route.back;
  if (route.home) {
    title.innerHTML = '';
    title.append(h('span', { class: 'brand-word', text: 'SAINT SOCIAL' }));
  } else {
    title.textContent = route.title;
  }
  actions.innerHTML = '';
  if (!route.back && !route.auth) {
    // primary tabs get global actions
    actions.append(
      h('button', { class: 'icon-btn', 'aria-label': 'Search', html: '🔍', onClick: () => (window.location.hash = '#/search') }),
      h('button', { class: 'icon-btn', 'aria-label': 'Notifications', html: '🔔', onClick: () => (window.location.hash = store.isAuthed ? '#/notifications' : '#/auth') }),
      h('button', { class: 'icon-btn', 'aria-label': 'Theme', text: store.theme === 'dark' ? '☀️' : '🌙', onClick: () => store.toggleTheme() }),
    );
    updateUnreadBadge();
  }
}

export function setHeader({ title, back, actions }) {
  const t = document.getElementById('ah-title');
  const b = document.getElementById('back-btn');
  const a = document.getElementById('ah-actions');
  if (title != null) t.textContent = title;
  if (back != null) b.hidden = !back;
  if (actions != null) { a.innerHTML = ''; actions.forEach((n) => a.append(n)); }
}
export function updateUnreadBadge() {
  const a = document.getElementById('ah-actions');
  const bell = [...a.querySelectorAll('.icon-btn')].find((x) => x.getAttribute('aria-label') === 'Notifications');
  if (!bell) return;
  bell.classList.remove('badge-num');
  const dot = bell.querySelector('.badge-dot'); if (dot) dot.remove();
  if (store.unread > 0) {
    const d = h('span', { class: 'badge-dot', text: store.unread > 9 ? '9+' : String(store.unread) });
    bell.classList.add('badge-num');
    bell.append(d);
  }
}

function setNav(tab) {
  const nav = document.getElementById('bottom-nav');
  [...nav.children].forEach((c) => c.classList.toggle('active', c.dataset.tab === tab));
}

export async function navigate() {
  const { route, path, query, id } = parse();
  if (route.auth && !store.isAuthed) { window.location.hash = '#/auth'; return; }
  if (route.admin && !store.isAdmin) { window.location.hash = '#/home'; return; }
  current = route;

  renderHeader(route);
  setNav(route.tab || '');
  const view = document.getElementById('view');
  view.scrollTop = 0;
  view.innerHTML = '';
  const ctx = {
    user: store.user, token: store.token, query, id, path,
    goto: (hash) => (window.location.hash = hash),
    refresh: () => navigate(),
    setHeader, updateUnreadBadge,
  };
  try {
    const node = await route.view.render(view, ctx);
    if (node) view.append(node);
  } catch (err) {
    console.error(err);
    view.append(h('div', { class: 'empty' },
      h('div', { class: 'big', text: '⚠️' }),
      h('h3', { text: 'Something went wrong' }),
      h('p', { text: err.message }),
      h('button', { class: 'btn btn-primary mt', text: 'Try again', onClick: () => navigate() }),
    ));
  }
}

export function getCurrent() { return current; }
window.addEventListener('hashchange', navigate);
