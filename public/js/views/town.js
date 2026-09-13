'use strict';
import { api } from '../api.js';
import { h, updateCard, placeCard, eventRow, emptyState, skeletonList, skeletonCards } from '../ui.js';

export async function render(container, ctx) {
  container.innerHTML = '';

  // quick links
  container.append(h('div', { class: 'qa-grid mb' },
    h('a', { class: 'qa', href: '#/map' }, h('span', { class: 'qa-ico', style: { background: 'var(--sea-soft)' }, text: '🗺️' }), h('span', { class: 'qa-t', text: 'Explore the map' })),
    h('a', { class: 'qa', href: '#/university' }, h('span', { class: 'qa-ico', style: { background: 'var(--brand-soft)' }, text: '🎓' }), h('span', { class: 'qa-t', text: 'University updates' })),
  ));

  // town updates
  container.append(h('div', { class: 'section-head' },
    h('div', { class: 'section-title' }, h('span', { class: 'emoji', text: '📢' }), h('span', { text: 'Town updates' }))));
  const updatesEl = h('div', { class: 'stack-sm' }, skeletonList(3));
  container.append(updatesEl);

  // what's on
  container.append(h('div', { class: 'section-head', style: { marginTop: '22px' } },
    h('div', { class: 'section-title' }, h('span', { class: 'emoji', text: '✨' }), h('span', { text: "What's on around town" })),
    h('a', { class: 'section-link', href: '#/events?filter=week', text: 'All events' })));
  const onEl = h('div', { class: 'stack-sm' }, skeletonList(2));
  container.append(onEl);

  // local places
  const placeSearch = h('input', { class: 'input', placeholder: 'Search places…' });
  const catChips = h('div', { class: 'chip-row', style: { marginTop: '10px' } });
  const placesEl = h('div', { class: 'stack-sm', style: { marginTop: '10px' } }, skeletonCards(3));
  container.append(h('div', { class: 'section-head', style: { marginTop: '22px' } },
    h('div', { class: 'section-title' }, h('span', { class: 'emoji', text: '📍' }), h('span', { text: 'Local places' }))));
  container.append(h('div', { class: 'search-bar mb-sm' }, h('span', { class: 'sicon', text: '🔍' }), placeSearch));
  container.append(catChips);
  container.append(placesEl);

  let activeCat = 'all'; let q = '';
  async function loadPlaces() {
    placesEl.innerHTML = '';
    try {
      const d = await api.get('/api/town/places' + (activeCat !== 'all' ? '?category=' + activeCat : '') + (q ? (activeCat !== 'all' ? '&' : '?') + 'q=' + encodeURIComponent(q) : ''));
      (d.places.length ? d.places : []).slice(0, 12).forEach((p) => placesEl.append(placeCard(p)));
      if (!d.places.length) placesEl.append(emptyState('📍', 'No places found', 'Try a different search.'));
      catChips.innerHTML = '';
      catChips.append(chip('all', 'All', ''));
      d.categories.forEach((c) => catChips.append(chip(c.id, c.label, c.emoji)));
    } catch { placesEl.append(emptyState('⚠️', 'Couldn’t load places')); }
  }
  function chip(id, label, emoji) {
    return h('button', { class: 'chip' + (activeCat === id ? ' active' : ''), text: (emoji ? emoji + ' ' : '') + label, onClick: () => { activeCat = id; loadPlaces(); } });
  }
  placeSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') { q = placeSearch.value.trim(); loadPlaces(); } });
  placeSearch.addEventListener('input', debounce(() => { q = placeSearch.value.trim(); loadPlaces(); }, 300));
  loadPlaces();

  // load updates + events
  (async () => {
    try {
      const [u, ev] = await Promise.all([api.get('/api/town/updates?limit=8'), api.get('/api/events?filter=week')]);
      updatesEl.innerHTML = '';
      if (u.updates.length) u.updates.slice(0, 6).forEach((x) => updatesEl.append(updateCard(x, { kind: 'town' })));
      else updatesEl.append(emptyState('📢', 'No town updates'));
      onEl.innerHTML = '';
      (ev.events || []).slice(0, 5).forEach((e) => onEl.append(eventRow(e)));
      if (!(ev.events || []).length) onEl.append(emptyState('✨', 'Nothing on this week'));
    } catch { updatesEl.append(emptyState('⚠️', 'Couldn’t load')); onEl.innerHTML = ''; }
  })();
}

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
