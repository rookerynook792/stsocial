'use strict';
import { api } from '../api.js';
import { store } from '../store.js';
import { h, postCard, emptyState, skeletonList, goto } from '../ui.js';

const TABS = [
  { id: 'trending', label: 'Trending' }, { id: 'latest', label: 'Latest' },
  { id: 'discussed', label: 'Most Discussed' }, { id: 'events', label: 'Events' },
  { id: 'questions', label: 'Questions' },
];

function buildHash(tab, type) {
  const p = new URLSearchParams();
  if (tab && tab !== 'trending') p.set('tab', tab);
  if (type) p.set('type', type);
  const s = p.toString();
  return '#/forum' + (s ? '?' + s : '');
}

export async function render(container, ctx) {
  const tab = ctx.query.tab || 'trending';
  const type = ctx.query.type || '';

  // compose prompt
  const prompt = h('div', { class: 'card', style: { padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' } },
    h('div', { class: 'avatar', style: { width: '44px', height: '44px', fontSize: '22px' }, text: (store.user && store.user.avatar) || '👤' }),
    h('a', { class: 'input', style: { flex: 1, textAlign: 'left', color: 'var(--text-faint)', background: 'var(--surface-2)', cursor: 'pointer' }, href: store.isAuthed ? '#/compose/post' : '#/auth', text: store.isAuthed ? 'Share something with St Andrews…' : 'Sign in to post' }),
  );
  container.append(prompt);

  // tabs
  const tabs = h('div', { class: 'tabs mt' }, TABS.map((t) =>
    h('button', { class: 'tab' + (tab === t.id ? ' active' : ''), text: t.label, onClick: () => goto(buildHash(t.id, type)) })));
  container.append(tabs);

  // type chips (loaded with data)
  const typeChips = h('div', { class: 'chip-row' });
  container.append(typeChips);

  const list = h('div', { class: 'stack-sm', style: { marginTop: '4px' } }, skeletonList(5));
  container.append(list);

  let data;
  try { data = await api.get('/api/forum?tab=' + tab + (type ? '&type=' + type : '')); }
  catch (e) { list.innerHTML = ''; list.append(emptyState('⚠️', 'Couldn’t load', e.message)); return; }

  typeChips.innerHTML = '';
  typeChips.append(h('button', { class: 'chip' + (!type ? ' active' : ''), text: 'All', onClick: () => goto(buildHash(tab, '')) }));
  data.types.forEach((t) => typeChips.append(h('button', {
    class: 'chip' + (type === t.id ? ' active' : ''),
    onClick: () => goto(buildHash(tab, t.id)),
  }, h('span', { class: 'e', text: t.emoji }), ' ', h('span', { text: t.label }))));

  list.innerHTML = '';
  if (!data.posts.length) {
    list.append(emptyState('💬', 'No posts yet', 'Be the first to start a conversation.',
      store.isAuthed ? h('a', { class: 'btn btn-primary mt', style: { width: 'auto' }, href: '#/compose/post', text: 'Create a post' }) : null));
  } else {
    data.posts.forEach((p) => list.append(postCard(p)));
  }
}
