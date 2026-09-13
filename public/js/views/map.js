'use strict';
import { api } from '../api.js';
import { h, emptyState, sheet, gradClass, eventWhenLabel } from '../ui.js';

// Stylised, approximate coordinates on a 400×480 canvas.
const SPOTS = [
  { name: 'Castle Rock', x: 196, y: 120, kind: 'landmark' },
  { name: 'St Salvator’s', x: 205, y: 150, kind: 'landmark' },
  { name: 'Main Street', x: 214, y: 196, kind: 'landmark' },
  { name: 'The SA', x: 206, y: 184, kind: 'venue' },
  { name: 'Tay Park', x: 322, y: 210, kind: 'park' },
  { name: 'South Beach', x: 116, y: 300, kind: 'beach' },
  { name: 'Saltcoats', x: 112, y: 332, kind: 'beach' },
  { name: 'The Pier', x: 132, y: 286, kind: 'landmark' },
  { name: 'Sports Ground', x: 330, y: 288, kind: 'sport' },
  { name: 'University Quad', x: 262, y: 150, kind: 'university' },
  { name: 'West Sands', x: 120, y: 356, kind: 'beach' },
];
const CAT_COLOR = { nightlife: '#7C3AED', music: '#DB2777', sport: '#16A34A', arts: '#EA580C', university: '#4F46E5', food: '#D97706', societies: '#0EA5E9', academic: '#0D9488', careers: '#334155', outdoor: '#0891B2', charity: '#E11D48', other: '#64748B' };

function locate(name) {
  if (!name) return { x: 206, y: 190 };
  const s = name.toLowerCase();
  const rules = [
    [/castle|rock|salvator/, { x: 200, y: 135 }],
    [/main street|square/, { x: 214, y: 200 }],
    [/north street/, { x: 196, y: 220 }],
    [/south street/, { x: 188, y: 240 }],
    [/tay park|park/, { x: 322, y: 214 }],
    [/sport|ground|rugby/, { x: 330, y: 288 }],
    [/sa\b|students.? assoc|lounge|town centre|centre/, { x: 206, y: 188 }],
    [/beach|saltcoats|sands|pier|west sand/, { x: 120, y: 310 }],
    [/kinnaird|head/, { x: 108, y: 120 }],
    [/university|library|quad|campus/, { x: 262, y: 152 }],
  ];
  for (const [re, p] of rules) if (re.test(s)) return p;
  // stable pseudo-position
  let hash = 0; for (const c of s) hash = (hash * 31 + c.charCodeAt(0)) % 9973;
  return { x: 150 + (hash % 180), y: 160 + ((hash * 7) % 180) };
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs) { const e = document.createElementNS(SVG_NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }

export async function render(container, ctx) {
  container.innerHTML = '';
  let events = [], places = [];
  try { [events, places] = await Promise.all([api.get('/api/events?filter=week'), api.get('/api/town/places')]); } catch { /* keep going */ }
  events = events.events || [];
  places = places.places || [];

  const svg = svgEl('svg', { viewBox: '0 0 400 480', role: 'img', 'aria-label': 'St Andrews map' });

  // sea
  svg.append(svgEl('path', { d: 'M0 0 H120 C150 90 90 150 120 240 C150 330 90 400 140 480 H0 Z', fill: 'var(--sea-soft)', stroke: 'var(--sea)', 'stroke-width': 1.5 }));
  svg.append(svgEl('path', { d: 'M0 250 C60 235 95 260 118 300 C95 360 60 380 0 372 Z', fill: 'var(--sea-soft)', opacity: 0.7 }));
  // land base
  svg.append(svgEl('rect', { x: 0, y: 0, width: 400, height: 480, fill: 'none' }));
  // park
  svg.append(svgEl('ellipse', { cx: 322, cy: 214, rx: 52, ry: 44, fill: 'color-mix(in srgb, var(--success) 22%, transparent)', stroke: 'var(--success)', 'stroke-width': 1 }));
  // beach
  svg.append(svgEl('path', { d: 'M100 270 C150 250 175 300 150 350 C120 360 90 340 92 300 Z', fill: 'var(--warn-soft)', stroke: 'var(--gold)', 'stroke-width': 1 }));
  // roads
  svg.append(svgEl('path', { d: 'M200 120 L214 200 L196 250', stroke: 'var(--border-2)', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }));
  svg.append(svgEl('path', { d: 'M214 200 L320 210', stroke: 'var(--border-2)', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }));
  svg.append(svgEl('path', { d: 'M206 188 L262 152 L330 288', stroke: 'var(--border-2)', 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round', opacity: 0.7 }));

  const markerRoot = svgEl('g', {});
  svg.append(markerRoot);

  function placeMarker(x, y, color, emoji, label, onClick, title) {
    const g = svgEl('g', { class: 'map-pin', cursor: 'pointer' });
    g.append(svgEl('circle', { cx: x, cy: y, r: 13, fill: color, opacity: 0.9, stroke: '#fff', 'stroke-width': 2 }));
    const t = svgEl('text', { x: x, y: y + 4, 'text-anchor': 'middle', 'font-size': '13' });
    t.textContent = emoji;
    g.append(t);
    if (title) { const tt = svgEl('title', {}); tt.textContent = title; g.append(tt); }
    g.addEventListener('click', onClick);
    return g;
  }

  // landmarks (static)
  for (const s of SPOTS.filter((s) => s.kind === 'landmark' || s.kind === 'park' || s.kind === 'beach')) {
    const color = s.kind === 'park' ? 'var(--success)' : s.kind === 'beach' ? 'var(--gold)' : 'var(--text-faint)';
    const emoji = s.kind === 'park' ? '🌳' : s.kind === 'beach' ? '🏖️' : '⛪';
    markerRoot.append(placeMarker(s.x, s.y, color, emoji, s.name, () => landmarkSheet(s), s.name));
  }

  // university + sport
  markerRoot.append(placeMarker(262, 152, 'var(--brand)', '🎓', 'University', () => landmarkSheet({ name: 'University', kind: 'university', desc: 'The University of St Andrews — main campus and libraries.' }), 'University'));
  markerRoot.append(placeMarker(330, 288, 'var(--success)', '🏉', 'Sports', () => landmarkSheet({ name: 'Sports Ground', kind: 'sport', desc: 'University sports facilities and the rugby ground.' }), 'Sports Ground'));

  // places (venues)
  places.forEach((p) => {
    const pos = locate(p.address || p.name);
    const emoji = p.emoji || '📍';
    markerRoot.append(placeMarker(pos.x, pos.y, 'var(--text)', '📍', p.name, () => placeSheet(p, pos), p.name));
  });

  // events (on top, coloured by category, pulse if live)
  events.forEach((e) => {
    const pos = locate(e.location);
    const color = CAT_COLOR[e.category] || CAT_COLOR.other;
    const g = placeMarker(pos.x, pos.y, color, e.emoji || '📅', e.title, () => eventSheet(e, pos), e.title);
    // ring for live
    const now = Date.now();
    if (e.start_ms <= now && (e.end_time ? new Date(e.start_ms) + 1 : e.start_ms + 3 * 3600000) >= now - 0) {
      const ring = svgEl('circle', { cx: pos.x, cy: pos.y, r: 15, fill: 'none', stroke: color, 'stroke-width': 2, opacity: 0.5 });
      markerRoot.insertBefore(ring, g);
    }
  });

  const wrap = h('div', { class: 'map-wrap' });
  wrap.append(svg);
  wrap.append(h('div', { class: 'map-legend' },
    legend('var(--brand)', '🎓', 'University'),
    legend('var(--success)', '🌳', 'Park / Sport'),
    legend('#7C3AED', '🎉', 'Event'),
    legend('var(--text)', '📍', 'Place'),
    legend('var(--gold)', '🏖️', 'Beach'),
  ));
  container.append(h('p', { class: 'muted small mb-sm', text: 'Tap a marker to see what’s happening there. Positions are approximate.' }));
  container.append(wrap);
  container.append(h('p', { class: 'faint small', style: { marginTop: '10px', textAlign: 'center' }, text: events.length + ' events · ' + places.length + ' places this week' }));
}

function legend(color, ico, label) { return h('span', {}, h('span', { class: 'dot', style: { background: color } }), ' ', h('span', { text: ico + ' ' + label })); }

function landmarkSheet(s) {
  sheet({
    title: s.name,
    body: h('div', {},
      h('p', { class: 'muted', text: s.desc || 'A place around St Andrews.' }),
      h('div', { class: 'tag-soft mt-sm', text: '📍 ' + s.name }),
    ),
  });
}
function placeSheet(p, pos) {
  const related = [];
  sheet({
    title: p.name,
    body: h('div', {},
      h('p', { class: 'muted', text: p.description || '' }),
      h('div', { class: 'tag-soft mt-sm', text: '📍 ' + (p.address || '') }),
      h('div', { class: 'tag-soft mt-sm', text: '🕑 ' + (p.hours || '—') }),
      h('a', { class: 'btn btn-primary mt', style: { width: '100%' }, href: '#/place/' + p.id }, h('span', { text: 'View place & reviews' })),
    ),
  });
}
function eventSheet(e, pos) {
  sheet({
    title: e.title,
    body: h('div', {},
      h('div', { class: 'cat-badge mt-sm', style: { background: (e.category.color) + 'cc' }, html: `${e.category.emoji} ${e.category.label}` }),
      h('p', { class: 'muted', style: { marginTop: '10px' }, text: `${eventWhenLabel(e)} · ${e.location}` }),
      e.description ? h('p', { class: 'small', style: { marginTop: '8px' }, text: e.description }) : null,
      h('a', { class: 'btn btn-primary mt', style: { width: '100%' }, href: '#/event/' + e.id }, h('span', { text: 'View event' })),
    ),
  });
}
