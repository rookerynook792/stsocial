'use strict';
import { api } from '../api.js';
import { h, updateCard, emptyState, skeletonList, goto } from '../ui.js';

export async function render(container, ctx) {
  container.innerHTML = '';
  container.append(h('div', { class: 'hero', style: { background: 'linear-gradient(135deg,#1e3a8a,#3730a3,#0ea5e9)' } },
    h('span', { class: 'h-loc', text: '🏛️ University of St Andrews' }),
    h('h1', { style: { fontSize: '22px' }, text: 'Official updates' }),
    h('p', { text: 'Information from official university sources, clearly marked and verified.' }),
  ));

  let cat = 'all';
  const catRow = h('div', { class: 'chip-row', style: { flexWrap: 'wrap', marginTop: '14px' } });
  const list = h('div', { class: 'stack-sm', style: { marginTop: '12px' } }, skeletonList(4));
  container.append(catRow, list);

  async function load() {
    list.innerHTML = '';
    list.append(skeletonList(3));
    try {
      const d = await api.get('/api/university/updates' + (cat !== 'all' ? '?category=' + cat : ''));
      list.innerHTML = '';
      if (!d.updates.length) list.append(emptyState('🎓', 'No updates here', 'Check another category.'));
      d.updates.forEach((u) => list.append(updateCard(u, { kind: 'university' })));
      catRow.innerHTML = '';
      catRow.append(h('button', { class: 'chip' + (cat === 'all' ? ' active' : ''), text: 'All', onClick: () => { cat = 'all'; load(); } }));
      d.categories.forEach((c) => catRow.append(h('button', {
        class: 'chip' + (cat === c.id ? ' active' : ''), text: `${c.emoji} ${c.label}`,
        onClick: () => { cat = c.id; load(); },
      })));
    } catch (e) { list.innerHTML = ''; list.append(emptyState('⚠️', 'Couldn’t load', e.message)); }
  }
  load();
}
