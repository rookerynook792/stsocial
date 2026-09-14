'use strict';
import { api } from '../api.js';
import { h, emptyState, placeCard, sheet } from '../ui.js';
import { GUIDE } from '../data/guide.js';
import { SOCIETIES, SOCIETY_COUNT } from '../data/societies.js';

const SECTIONS = [
  { id: 'sec-overview', label: 'Overview', ico: '🧭' },
  { id: 'sec-history', label: 'History', ico: '🏛️' },
  { id: 'sec-facts', label: 'Fun Facts', ico: '💡' },
  { id: 'sec-do', label: 'Things to Do', ico: '🎯' },
  { id: 'sec-eats', label: 'Eats', ico: '🍽️' },
  { id: 'sec-night', label: 'Nightlife', ico: '🍺' },
  { id: 'sec-must', label: 'Must Do', ico: '⭐' },
  { id: 'sec-socs', label: 'Societies', ico: '🎓' },
];

function secHead(emoji, title, sub) {
  const t = h('div', { class: 'section-title' });
  t.append(h('span', { class: 'emoji', text: emoji }));
  t.append(h('span', { text: title }));
  const head = h('div', { class: 'section-head' }, t);
  if (sub) head.append(h('div', { class: 'faint small', text: sub }));
  return head;
}

function factCard(emoji, title, text) {
  const body = h('div', { style: { flex: 1 } });
  body.append(h('div', { class: 'ri-title', text: title }));
  body.append(h('div', { class: 'ri-sub', style: { marginTop: '4px' }, text: text }));
  const row = h('div', { class: 'flex aic gap' });
  row.append(h('span', { text: emoji, style: { fontSize: '20px' } }));
  row.append(body);
  return h('div', { class: 'card', style: { padding: '14px' } }, row);
}

function doCard(d) {
  const tags = h('div', { class: 'flex aic gap wrap', style: { marginTop: '7px' } });
  tags.append(h('span', { class: 'tag-soft', text: d.price }));
  tags.append(h('span', { class: 'tag-soft', text: '⏱ ' + d.time }));
  const mid = h('div', { style: { flex: 1, minWidth: 0 } });
  mid.append(h('div', { class: 'ri-title', text: d.title }));
  mid.append(h('div', { class: 'ri-sub', text: d.blurb }));
  mid.append(tags);
  const row = h('div', { class: 'flex aic gap' });
  row.append(h('span', { text: d.emoji, style: { fontSize: '22px' } }));
  row.append(mid);
  return h('button', { class: 'card do-card', style: { padding: '14px', textAlign: 'left' }, onClick: () => doSheet(d) }, row);
}

function doSheet(d) {
  const detail = h('p', { class: 'muted', style: { fontSize: '14px', lineHeight: '1.55' }, text: d.detail });
  const priceStat = h('div', { class: 'stat' });
  priceStat.append(h('div', { class: 'l', text: 'PRICE' }));
  priceStat.append(h('div', { style: { fontWeight: 800, fontSize: '15px', marginTop: '2px' }, text: d.price }));
  const timeStat = h('div', { class: 'stat' });
  timeStat.append(h('div', { class: 'l', text: 'TIME' }));
  timeStat.append(h('div', { style: { fontWeight: 800, fontSize: '15px', marginTop: '2px' }, text: d.time }));
  const grid = h('div', { class: 'stat-grid' }, priceStat, timeStat);
  const where = h('div', { style: { flex: 1 } });
  where.append(h('div', { class: 'ir-l', text: 'Where' }));
  where.append(h('div', { class: 'ir-v', text: d.where }));
  const whereRow = h('div', { class: 'info-row' }, h('div', { class: 'ir-ico', text: '📍' }), where);
  const body = h('div', { class: 'stack-sm' }, detail, grid, whereRow);
  const maps = h('a', { class: 'btn btn-primary',
    href: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(d.where + ', St Andrews, Fife, Scotland'),
    target: '_blank', rel: 'noopener' }, h('span', { text: '🗺️ Open in Google Maps' }));
  sheet({ title: d.emoji + ' ' + d.title, body, actions: [maps] });
}

export async function render(container) {
  container.innerHTML = '';

  /* hero */
  const hero = h('div', { class: 'hero' });
  hero.append(h('div', { class: 'h-loc' }, h('span', { text: '📍 St Andrews · Fife · Scotland' })));
  hero.append(h('h1', { text: GUIDE.heroTitle }));
  hero.append(h('p', { text: GUIDE.intro }));
  container.append(hero);

  /* stats */
  const stats = h('div', { class: 'stat-grid', style: { marginTop: '12px' } });
  GUIDE.stats.forEach((s) => {
    const cell = h('div', { class: 'stat' });
    cell.append(h('div', { class: 'n', text: s.v }));
    cell.append(h('div', { class: 'l', text: s.l }));
    stats.append(cell);
  });
  container.append(stats);

  /* section chips */
  const chips = h('div', { class: 'chip-row', style: {
    position: 'sticky', top: '58px', zIndex: 20,
    margin: '14px -16px 6px', padding: '8px 16px', background: 'var(--bg)',
  } });
  SECTIONS.forEach((s) => {
    const b = h('button', { class: 'chip', onClick: () => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) });
    b.append(h('span', { class: 'e', text: s.ico }), ' ', h('span', { text: s.label }));
    chips.append(b);
  });
  container.append(chips);

  /* overview / first 48 hours */
  const overview = h('div', { id: 'sec-overview', class: 'section' }, secHead('🧭', 'Your first 48 hours', 'The classic landing — do these first'));
  const starter = h('div', { class: 'stack-sm' });
  GUIDE.starter.forEach((s, i) => starter.append(factCard(s.emoji, i + 1 + '. ' + s.title, s.text)));
  overview.append(starter);
  container.append(overview);

  /* history timeline */
  const hist = h('div', { id: 'sec-history', class: 'section' }, secHead('🏛️', 'How St Andrews happened', '1,100+ years in 15 stops'));
  const tl = h('div', { class: 'timeline' });
  GUIDE.timeline.forEach((t) => {
    const card = h('div', { class: 'card', style: { padding: '13px 14px' } });
    card.append(h('div', { class: 'faint small', style: { fontWeight: 800 }, text: t.year }));
    card.append(h('div', { class: 'ri-title', style: { marginTop: '2px' }, text: t.title }));
    card.append(h('div', { class: 'ri-sub', style: { marginTop: '5px' }, text: t.text }));
    const item = h('div', { class: 'tl-item' }, h('div', { class: 'tl-dot' }), card);
    tl.append(item);
  });
  hist.append(tl);
  container.append(hist);

  /* fun facts */
  const factsSec = h('div', { id: 'sec-facts', class: 'section' }, secHead('💡', 'Fun facts', 'For when someone asks “what’s this place like?”'));
  const facts = h('div', { class: 'stack-sm' });
  GUIDE.facts.forEach((f) => facts.append(factCard(f.emoji, f.title, f.text)));
  factsSec.append(facts);
  container.append(factsSec);

  /* things to do */
  const doSec = h('div', { id: 'sec-do', class: 'section' }, secHead('🎯', 'Things to do', GUIDE.do.length + ' real ones — tap for details'));
  const dos = h('div', { class: 'stack-sm' });
  GUIDE.do.forEach((d) => dos.append(doCard(d)));
  doSec.append(dos);
  container.append(doSec);

  /* eats + nightlife (real venues from the places database) */
  let places = [];
  try {
    const d = await api.get('/api/town/places');
    places = d.places || [];
  } catch (e) { /* keep going */ }
  const eats = places.filter((p) => ['cafe', 'restaurant'].includes(p.category));
  const night = places.filter((p) => p.category === 'bar');

  const eatsHead = secHead('🍽️', 'Eats', null);
  eatsHead.append(h('a', { class: 'section-link', href: '#/town', text: 'See all →' }));
  const eatsSec = h('div', { id: 'sec-eats', class: 'section' }, eatsHead);
  const eatsList = h('div', { class: 'stack-sm' });
  if (eats.length) eats.forEach((p) => eatsList.append(placeCard(p)));
  else eatsList.append(emptyState('🍽️', 'Loading…'));
  eatsSec.append(eatsList);
  container.append(eatsSec);

  const nightHead = secHead('🍺', 'Pubs & nightlife', null);
  nightHead.append(h('a', { class: 'section-link', href: '#/town', text: 'See all →' }));
  const nightSec = h('div', { id: 'sec-night', class: 'section' }, nightHead);
  const nightList = h('div', { class: 'stack-sm' });
  if (night.length) night.forEach((p) => nightList.append(placeCard(p)));
  else nightList.append(emptyState('🍺', 'Nothing here yet'));
  nightSec.append(nightList);
  container.append(nightSec);

  /* must do */
  const mustSec = h('div', { id: 'sec-must', class: 'section' }, secHead('⭐', 'Do not miss', 'The shortlist every year follows'));
  const must = h('div', { class: 'stack-sm' });
  GUIDE.dontMiss.forEach((m, i) => {
    const txt = h('div', { style: { flex: 1 } });
    txt.append(h('div', { class: 'ri-title' }, h('span', { text: m.emoji + ' ' }), h('span', { text: m.title })));
    txt.append(h('div', { class: 'ri-sub', style: { marginTop: '4px' }, text: m.text }));
    const num = h('div', { class: 'n', style: { fontSize: '18px', fontWeight: 900, color: 'var(--brand)', flex: 'none', width: '26px' }, text: String(i + 1) });
    must.append(h('div', { class: 'card', style: { padding: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' } }, num, txt));
  });
  mustSec.append(must);
  container.append(mustSec);

  /* societies & networks — full official directory */
  container.append(renderSocieties());
}
