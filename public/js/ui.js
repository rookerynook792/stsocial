'use strict';
import { store } from './store.js';
import { api } from './api.js';

/* ------------------------------ DOM helpers ----------------------------- */
export function h(tag, props, ...children) {
  const e = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  }
  const flat = children.flat(Infinity);
  for (const c of flat) {
    if (c == null || c === false) continue;
    e.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return e;
}
export const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ------------------------------ formatters ------------------------------ */
const DAY = 86400000;
function sod(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
export function timeAgo(ms) {
  const s = Math.max(1, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return s + 's ago';
  const m = Math.round(s / 60); if (m < 60) return m + (m === 1 ? ' min ago' : ' mins ago');
  const hr = Math.round(m / 60); if (hr < 24) return hr + (hr === 1 ? ' hour ago' : ' hours ago');
  const d = Math.round(hr / 24); if (d < 7) return d + (d === 1 ? ' day ago' : ' days ago');
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
export function fmtTime(ms) { return new Date(ms).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' }); }
export function fmtClock(hm) {
  if (!hm) return '';
  const [hh, mm] = hm.split(':').map(Number);
  const am = hh < 12; const hr = ((hh + 11) % 12) + 1;
  return `${hr}:${String(mm).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
}
export function dayLabel(startMs) {
  const t0 = sod(Date.now());
  const d0 = sod(startMs);
  if (d0 === t0) return 'Today';
  if (d0 === t0 + DAY) return 'Tomorrow';
  const opts = d0 > t0 && d0 < t0 + 7 * DAY ? { weekday: 'short', day: 'numeric' } : { day: 'numeric', month: 'short' };
  return new Date(startMs).toLocaleDateString('en-GB', opts);
}
export function eventWhenLabel(evt) {
  return `${dayLabel(evt.start_ms)} · ${fmtTime(evt.start_ms)}`;
}
export function isHappeningNow(evt) {
  const now = Date.now();
  return evt.start_ms <= now && endMsOf(evt) >= now;
}
function endHm(evt) { if (!evt.end_time) return 0; const [a, b] = evt.end_time.split(':').map(Number); return a * 3600000 + b * 60000; }
function endMsOf(evt) { return evt.end_time ? sod(evt.start_ms) + endHm(evt) : evt.start_ms + 3 * 3600000; }

export function plural(n, w) { return `${n} ${w}${n === 1 ? '' : 's'}`; }

/* ------------------------------- gradients ------------------------------ */
export function gradClass(key) {
  if (!key) return 'g-default';
  if (/^(https?:|\/)/.test(key)) return '';
  return 'g-' + key;
}
export function mediaNode(evt, cls = '') {
  const key = evt.image;
  const isUrl = key && /^(https?:|\/)/.test(key);
  const node = h('div', { class: `ec-media ${gradClass(key)} ${cls}` });
  if (isUrl) node.append(h('img', { src: key, alt: '' }));
  node.append(h('span', { class: 'goverlay' }));
  if (!isUrl && evt.emoji) node.append(h('span', { style: { position: 'relative', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.35))' }, text: evt.emoji }));
  return node;
}

/* ------------------------------- avatars -------------------------------- */
export function avatarNode(user, size = '') {
  const cls = 'avatar' + (size ? ' ' + size : '');
  const a = h('div', { class: cls });
  if (user && user.avatar && /^https?:/.test(user.avatar)) a.append(h('img', { src: user.avatar, alt: '' }));
  else a.append(document.createTextNode((user && user.avatar) || '👤'));
  if (user && user.verified) a.append(h('span', { class: 'verified-tick', text: '✓' }));
  return a;
}

/* -------------------------------- badges -------------------------------- */
export function sourceBadge(evt, { solid = false } = {}) {
  const s = evt.source || {};
  let cls, label;
  if (s.type === 'university') { cls = 'university'; label = '🏛️ University'; }
  else if (s.type === 'verified') { cls = 'verified'; label = '✓ Verified'; }
  else if (s.type === 'imported') { cls = 'imported'; label = '⚡ Imported'; }
  else { cls = 'community'; label = '👥 Community'; }
  return h('span', { class: `badge ${cls}${solid ? ' solid' : ''}`, text: label });
}
export function demoChip() { return h('span', { class: 'badge demo', text: 'DEMO' }); }
export function catBadge(cat, { solid = true } = {}) {
  return h('span', { class: 'cat-badge', style: solid ? { background: cat.color + 'cc' } : {}, html: `${cat.emoji} ${esc(cat.label)}` });
}
export function verifiedTag() {
  return h('span', { class: 'tag-soft', style: { background: 'var(--brand-soft)', color: 'var(--brand)' }, text: '✓ ST ANDREWS STUDENT' });
}

/* ---------------------------- interested btn ---------------------------- */
export function interestedButton(evt, { type = 'interested', label = 'Interested' } = {}) {
  const active = evt.my && evt.my[type];
  const count = evt.interested_count;
  const btn = h('button', {
    class: 'pill-btn' + (active ? ' active' : ''),
    onClick: (e) => { e.preventDefault(); e.stopPropagation(); onInterest(evt, type, btn); },
    html: `${active ? '✓ ' : '＋ '}${label}`,
  });
  return h('span', { class: 'ec-interest' + (active ? ' active' : ''), title: `${count} ST SOCIAL students are interested`, onClick: (e) => { e.preventDefault(); e.stopPropagation(); onInterest(evt, type, btn); } },
    btn,
    h('span', { text: count > 0 ? String(count) : '' }),
  );
}
async function onInterest(evt, type, btn) {
  if (!store.isAuthed) { goto('auth'); return; }
  try {
    const out = await api.post(`/api/events/${evt.id}/interest`, { type });
    evt.interested_count = out.event.interested_count;
    evt.my = out.event.my;
    const active = out.event.my[type];
    btn.classList.toggle('active', active);
    btn.innerHTML = `${active ? '✓ ' : '＋ '}${type === 'going' ? 'Going' : 'Interested'}`;
    const cnt = btn.parentElement.querySelector('span:last-child');
    if (cnt) cnt.textContent = out.event.interested_count > 0 ? String(out.event.interested_count) : '';
    store.notify('interest');
  } catch (err) { toast(err.message, 'error'); }
}

/* ------------------------------ event card ------------------------------ */
export function eventCard(evt, { horizontal = false } = {}) {
  const live = isHappeningNow(evt);
  const card = h('a', { class: 'event-card', href: '#/event/' + evt.id });
  const media = mediaNode(evt);
  const tags = h('div', { class: 'ec-tags' }, catBadge(evt.category));
  media.append(tags);
  if (live) media.append(h('span', { class: 'ec-live' }, h('span', { class: 'd' }), 'LIVE'));
  const body = h('div', { class: 'ec-body' },
    h('div', { class: 'ec-title', text: evt.title }),
    h('div', { class: 'ec-meta' },
      h('span', { text: eventWhenLabel(evt) }),
      h('span', { class: 'dot', text: '·' }),
      h('span', { text: evt.location }),
    ),
    evt.description ? h('div', { class: 'ec-desc', text: evt.description }) : null,
    h('div', { class: 'ec-foot' },
      interestedButton(evt),
      sourceBadge(evt),
    ),
  );
  card.append(media, body);
  return card;
}

/* ------------------------------ event row ------------------------------- */
export function eventRow(evt) {
  const a = h('a', { class: 'card event-row', href: '#/event/' + evt.id });
  const isUrl = evt.image && /^(https?:|\/)/.test(evt.image);
  const thumb = h('div', { class: 'thumb ' + gradClass(evt.image || 'default') });
  if (isUrl) thumb.append(h('img', { src: evt.image, alt: '' }));
  else thumb.append(document.createTextNode(evt.emoji || '📅'));
  a.append(thumb, h('div', { class: 'er-body' },
    h('div', { class: 'er-title', text: evt.title }),
    h('div', { class: 'er-meta' }, eventWhenLabel(evt), ' · ', evt.location),
    h('div', { class: 'er-meta', style: { marginTop: '6px' } },
      h('span', { class: 'cat-badge', style: { background: evt.category.color + 'cc' }, html: `${evt.category.emoji} ${evt.category.label}` }),
      ' ', h('span', { class: 'muted small', text: '❤ ' + evt.interested_count }),
    ),
  ));
  return a;
}

/* ------------------------------- post card ------------------------------ */
export function postCard(post) {
  const a = h('a', { class: 'card post-card', href: '#/post/' + post.id });
  const head = h('div', { class: 'post-head' },
    avatarNode(post.author, 'sm'),
    h('div', { class: 'who' },
      h('div', { class: 'name' },
        h('span', { text: post.author ? post.author.name : 'Student' }),
        post.author && post.author.verified ? h('span', { class: 'verified-tick', style: { position: 'static', width: '14px', height: '14px', display: 'inline-grid' }, text: '✓' }) : null,
      ),
      h('div', { class: 'sub' }, h('span', { text: '@' + (post.author ? post.author.username : 'student') }), '  ', h('span', { text: timeAgo(post.created_at) })),
    ),
    h('span', { class: 'type-tag' }, h('span', { text: post.type.emoji }), ' ', post.type.label),
  );
  a.append(head);
  if (post.title) a.append(h('div', { class: 'post-title', text: post.title }));
  a.append(h('div', { class: 'post-body', text: post.body }));
  const foot = h('div', { class: 'post-foot' },
    h('span', { class: 'pf', html: `👍 <b>${post.upvotes}</b>` }),
    h('span', { class: 'pf', html: `💬 <b>${post.comments}</b>` }),
    post.saved ? h('span', { class: 'pf active', html: '🔖 Saved' }) : null,
    h('span', { style: { marginLeft: 'auto' }, class: 'pf', html: '↗ Share' }),
  );
  a.append(foot);
  return a;
}

/* ------------------------------ update card ----------------------------- */
export function updateCard(item, { kind = 'town' } = {}) {
  const c = h('div', { class: 'card update-card' });
  const important = item.important ? ' 🚨' : '';
  c.append(
    h('div', { class: 'u-top' },
      kind === 'university'
        ? h('span', { class: 'univ-badge', text: '🏛️ UNIVERSITY VERIFIED' })
        : (item.verified ? sourceBadge({ source: { type: 'verified' } }) : sourceBadge({ source: { type: 'community' } })),
      h('span', { class: 'u-cat', style: { marginLeft: 'auto' }, text: (item.category || '').replace(/_/g, ' ') }),
    ),
    h('div', { class: 'u-title', text: item.title + important }),
    item.body ? h('div', { class: 'u-body', text: item.body }) : null,
    h('div', { class: 'u-foot' }, h('span', { text: item.source_name || 'ST SOCIAL' }), ' · ', h('span', { text: timeAgo(item.created_at) })),
  );
  return c;
}

/* ------------------------------- place card ----------------------------- */
function stars(r) {
  const full = Math.round(r);
  return h('span', { class: 'stars', html: '★'.repeat(full) + '☆'.repeat(5 - full) + ' <b style="color:var(--text-dim)">' + (r || 0).toFixed(1) + '</b>' });
}
export function placeCard(place) {
  const a = h('a', { class: 'card place-card', href: '#/place/' + place.id });
  const key = place.image; const isUrl = key && /^(https?:|\/)/.test(key);
  const thumb = h('div', { class: 'p-thumb ' + gradClass(key) });
  if (isUrl) thumb.append(h('img', { src: key, alt: '' }));
  thumb.append(document.createTextNode(place.emoji || '📍'));
  a.append(thumb, h('div', { class: 'er-body' },
    h('div', { class: 'p-name', text: place.name }),
    place.review_count > 0
      ? h('div', { class: 'p-sub' }, stars(place.rating), ' ', h('span', { class: 'faint', text: '· ' + place.review_count + ' reviews' }))
      : h('div', { class: 'p-sub' },
          place.price ? h('span', { class: 'tag-soft', text: place.price }) : null,
          place.vibe ? h('span', { class: 'faint', text: '  ' + place.vibe }) : null),
    place.address ? h('div', { class: 'p-sub', text: place.address }) : null,
    place.description ? h('div', { class: 'p-desc', text: place.description }) : null,
  ));
  return a;
}
export const CAT_LABEL = { bar: 'Bar & nightlife', cafe: 'Café', restaurant: 'Restaurant', shop: 'Shops', gym: 'Gym', entertainment: 'Entertainment', service: 'Services', golf: 'Golf', landmark: 'Landmark' };
export { stars };

/* --------------------------------- toast -------------------------------- */
export function toast(msg, type = 'info', ms = 2600) {
  const t = h('div', { class: `toast ${type}` }, h('span', { text: msg }));
  const box = document.getElementById('toaster');
  box.append(t);
  setTimeout(() => { t.classList.add('leaving'); setTimeout(() => t.remove(), 260); }, ms);
}

/* --------------------------------- sheet -------------------------------- */
export function sheet({ title, body, center = false, onClose, actions = [] }) {
  const root = document.getElementById('sheet-root');
  const backdrop = h('div', { class: 'sheet-backdrop' });
  const sh = h('div', { class: 'sheet' + (center ? ' center' : '') });
  const close = () => { backdrop.remove(); sh.remove(); if (onClose) onClose(); };
  const head = h('div', { class: 'sheet-head' },
    h('h3', { text: title || '' }),
    h('button', { class: 'icon-btn', text: '×', onClick: close, 'aria-label': 'Close' }),
  );
  const bodyEl = typeof body === 'function' ? body(close, sh) : (body || h('div'));
  sh.append(h('div', { class: 'sheet-grip' }), head, h('div', { class: 'sheet-body' }, bodyEl));
  if (actions.length) {
    const row = h('div', { class: 'btn-row mt' });
    for (const a of actions) row.append(a);
    sh.querySelector('.sheet-body').append(row);
  }
  backdrop.addEventListener('click', close);
  root.append(backdrop, sh);
  return close;
}
export function confirmBox(msg, { title = 'Are you sure?', danger = false, okLabel = 'Confirm', onOk } = {}) {
  const close = sheet({
    title, center: true,
    body: h('p', { class: 'muted', text: msg }),
    actions: [
      h('button', { class: 'btn btn-ghost', text: 'Cancel', onClick: close }),
      h('button', { class: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'), text: okLabel, onClick: async () => { close(); if (onOk) await onOk(); } }),
    ],
  });
  return close;
}

/* --------------------------- skeleton / empty --------------------------- */
export function skeletonCards(n = 4) {
  return Array.from({ length: n }, () => h('div', { class: 'skel skel-card' }));
}
export function skeletonList(n = 5) {
  return Array.from({ length: n }, () => h('div', { class: 'card', style: { padding: '16px' } },
    h('div', { class: 'skel', style: { height: '14px', width: '40%' } }),
    h('div', { class: 'skel', style: { height: '12px', width: '70%', marginTop: '8px' } }),
    h('div', { class: 'skel', style: { height: '12px', width: '55%', marginTop: '6px' } }),
  ));
}
export function emptyState(emoji = '🌙', title = 'Nothing here yet', desc = '', action) {
  const e = h('div', { class: 'empty' },
    h('div', { class: 'big', text: emoji }),
    h('h3', { text: title }),
    desc ? h('p', { text: desc }) : null,
    action,
  );
  return e;
}

/* ------------------------------- navigate ------------------------------- */
export function goto(hash) { window.location.hash = hash; }
export function openProfile(username) { goto('profile/' + username); }
