'use strict';
import { api } from '../api.js';
import { store } from '../store.js';
import { h, eventCard, postCard, emptyState, skeletonList, timeAgo } from '../ui.js';

const TYPES = [
  { id: 'all', label: 'All' }, { id: 'events', label: 'Events' }, { id: 'posts', label: 'Posts' },
  { id: 'people', label: 'People' }, { id: 'societies', label: 'Societies' },
  { id: 'venues', label: 'Venues' }, { id: 'town', label: 'Town' }, { id: 'university', label: 'University' },
];

export async function render(container, ctx) {
  container.innerHTML = '';
  let q = ctx.query.q || '';
  let type = ctx.query.type || 'all';

  const input = h('input', { class: 'input', placeholder: 'Search events, posts, people, societies…', value: q, autofocus: true });
  const sugBox = h('div', { class: 'card', style: { display: 'none', marginTop: '6px', padding: '6px' } });
  const searchBar = h('div', { class: 'search-bar mb' }, h('span', { class: 'sicon', text: '🔍' }), input);
  container.append(searchBar, sugBox);

  const chipRow = h('div', { class: 'chip-row' }, TYPES.map((t) => h('button', { class: 'chip' + (type === t.id ? ' active' : ''), text: t.label, onClick: () => { type = t.id; refreshChips(); if (q) runSearch(); } })));
  function refreshChips() { [...chipRow.children].forEach((c, i) => c.classList.toggle('active', TYPES[i].id === type)); }
  container.append(chipRow);

  const results = h('div', { style: { marginTop: '10px' } });
  container.append(results);

  async function runSearch() {
    q = input.value.trim();
    if (!q) { results.innerHTML = ''; return; }
    results.innerHTML = ''; results.append(skeletonList(4));
    try {
      const d = await api.get('/api/search?q=' + encodeURIComponent(q) + '&type=' + type);
      results.innerHTML = '';
      const hasAny = d.results.events.length || d.results.posts.length || d.results.people.length || d.results.societies.length || d.results.places.length || d.results.townUpdates.length || d.results.universityUpdates.length;
      if (!hasAny) { results.append(emptyState('🔎', 'No results for “' + q + '”', 'Try a different term or filter.')); return; }
      if (d.results.events.length) results.append(group('Events', '📅'), d.results.events.map((e) => eventCard(e)));
      if (d.results.posts.length) results.append(group('Posts', '💬'), h('div', { class: 'stack-sm' }, d.results.posts.map((p) => postCard(p))));
      if (d.results.people.length) results.append(group('People', '👥'), d.results.people.map((p) => {
        return h('a', { class: 'row-item', style: { display: 'flex' }, href: '#/profile/' + p.username },
          avatarP(p),
          h('div', { class: 'ri-body' },
            h('div', { class: 'ri-title' },
              h('span', { text: p.name }),
              p.verified ? h('span', { class: 'verified-tick', style: { position: 'static', width: '14px', height: '14px', display: 'inline-grid', marginLeft: '6px' }, text: '✓' }) : null,
            ),
            h('div', { class: 'ri-sub', text: '@' + p.username + (p.course ? ' · ' + p.course : '') }),
          ),
        );
      }));
      if (d.results.societies.length) results.append(group('Societies', '🧑‍🤝‍🧑'), d.results.societies.map((s) =>
        h('div', { class: 'row-item' }, h('span', { class: 'qa-ico', style: { width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: '20px' }, text: s.emoji || '🧑‍🤝‍🧑' }),
          h('div', { class: 'ri-body' }, h('div', { class: 'ri-title', text: s.name }), h('div', { class: 'ri-sub', text: s.category + ' · ' + s.members + ' members' })) )));
      if (d.results.places.length) results.append(group('Venues & places', '📍'), d.results.places.map((p) =>
        h('a', { class: 'row-item', href: '#/place/' + p.id }, h('span', { class: 'qa-ico', style: { width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: '20px' }, text: p.emoji || '📍' }),
          h('div', { class: 'ri-body' }, h('div', { class: 'ri-title', text: p.name }), h('div', { class: 'ri-sub', text: p.address })))));
      if (d.results.townUpdates.length) results.append(group('Town updates', '🏘️'), d.results.townUpdates.map((u) => h('div', { class: 'row-item' }, h('div', { class: 'ri-body' }, h('div', { class: 'ri-title', text: u.title }), h('div', { class: 'ri-sub', text: timeAgo(u.created_at) })) )));
      if (d.results.universityUpdates.length) results.append(group('University', '🎓'), d.results.universityUpdates.map((u) => h('div', { class: 'row-item' }, h('div', { class: 'ri-body' }, h('div', { class: 'ri-title', text: u.title }), h('div', { class: 'ri-sub', text: 'University Verified' })) )));
    } catch (e) { results.innerHTML = ''; results.append(emptyState('⚠️', 'Search failed', e.message)); }
  }

  function group(title, emoji) {
    return h('div', { class: 'section-title', style: { fontSize: '14px', margin: '18px 2px 10px' } }, h('span', { text: emoji }), ' ', h('span', { text: title }));
  }
  function avatarP(p) {
    const a = h('div', { class: 'avatar', style: { width: '40px', height: '40px', fontSize: '20px' }, text: p.avatar || '👤' });
    if (p.verified) a.append(h('span', { class: 'verified-tick', text: '✓' }));
    return a;
  }

  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });
  let sugTimer;
  input.addEventListener('input', () => {
    clearTimeout(sugTimer);
    const v = input.value.trim().toLowerCase();
    if (v.length < 2) { sugBox.style.display = 'none'; return; }
    sugTimer = setTimeout(async () => {
      try {
        const s = (await api.get('/api/search/suggest?q=' + encodeURIComponent(v))).suggestions;
        sugBox.innerHTML = '';
        if (!s.length) { sugBox.style.display = 'none'; return; }
        s.forEach((x) => sugBox.append(h('button', { class: 'row-item', style: { width: '100%', textAlign: 'left', border: 'none' },
          onClick: () => { input.value = x.text; sugBox.style.display = 'none'; runSearch(); } },
          h('span', { text: iconFor(x.type) }), ' ', h('span', { text: x.text }))));
        sugBox.style.display = 'block';
      } catch { /* ignore */ }
    }, 250);
  });
  function iconFor(t) { return ({ event: '📅', post: '💬', society: '🧑‍🤝‍🧑', venue: '📍', person: '👤' }[t] || '🔎'); }

  if (q) runSearch();
}
