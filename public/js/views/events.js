'use strict';
import { api } from '../api.js';
import { h, eventCard, emptyState, skeletonCards, goto } from '../ui.js';

const TIME_FILTERS = [
  { id: 'today', label: 'Today' }, { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'week', label: 'This Week' }, { id: 'weekend', label: 'This Weekend' },
  { id: 'next_week', label: 'Next Week' }, { id: 'upcoming', label: 'All' },
];

function buildHash(f, c, q) {
  const p = new URLSearchParams();
  if (f && f !== 'upcoming') p.set('filter', f);
  if (c && c !== 'all') p.set('category', c);
  if (q) p.set('q', q);
  const s = p.toString();
  return '#/events' + (s ? '?' + s : '');
}

export async function render(container, ctx) {
  const f = ctx.query.filter || 'upcoming';
  const c = ctx.query.category || 'all';
  const q = ctx.query.q || '';

  // search bar
  const input = h('input', { class: 'input', placeholder: 'Search events…', value: q });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') goto(buildHash(f, c, input.value.trim())); });
  const search = h('div', { class: 'search-bar mb' }, h('span', { class: 'sicon', text: '🔍' }), input);
  container.append(search);

  // time filters
  const timeRow = h('div', { class: 'chip-row' }, TIME_FILTERS.map((t) =>
    h('button', { class: 'chip' + (f === t.id ? ' active' : ''), text: t.label, onClick: () => goto(buildHash(t.id, c, q)) }, h('span', { text: t.label })),
  ));
  container.append(timeRow);

  const list = h('div', { class: 'stack-sm', style: { marginTop: '6px' } }, skeletonCards(4));
  container.append(list);

  let cats = TIME_FILTERS; // placeholder
  let data;
  try { data = await api.get('/api/events?filter=' + f + (c !== 'all' ? '&category=' + c : '') + (q ? '&q=' + encodeURIComponent(q) : '')); }
  catch (e) { list.innerHTML = ''; list.append(emptyState('⚠️', 'Couldn’t load events', e.message)); return; }

  // category chips
  const catRow = h('div', { class: 'chip-row' },
    h('button', { class: 'chip' + (c === 'all' ? ' active' : ''), text: 'All', onClick: () => goto(buildHash(f, 'all', q)) }),
    data.categories.map((cat) => h('button', {
      class: 'chip' + (c === cat.id ? ' active' : ''),
      onClick: () => goto(buildHash(f, cat.id, q)),
    }, h('span', { class: 'e', text: cat.emoji }), ' ', h('span', { text: cat.label }))),
  );
  timeRow.after(catRow);

  list.innerHTML = '';
  if (!data.events.length) {
    list.append(emptyState('🔎', 'No events found', 'Try a different day, category or search term.',
      h('button', { class: 'btn btn-primary mt', style: { width: 'auto' }, text: 'Clear filters', onClick: () => goto('#/events') })));
  } else {
    data.events.forEach((e) => list.append(eventCard(e)));
  }
}
