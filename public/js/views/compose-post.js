'use strict';
import { api } from '../api.js';
import { store } from '../store.js';
import { h, toast, goto } from '../ui.js';

const TYPES = [
  { id: 'discussion', label: 'Discussion', emoji: '💬' },
  { id: 'question', label: 'Question', emoji: '❓' },
  { id: 'announcement', label: 'Announcement', emoji: '📣' },
  { id: 'recommendation', label: 'Recommendation', emoji: '⭐' },
  { id: 'lostfound', label: 'Lost & Found', emoji: '🔎' },
  { id: 'accommodation', label: 'Accommodation', emoji: '🏠' },
  { id: 'buysell', label: 'Buy & Sell', emoji: '🛒' },
  { id: 'society', label: 'Society', emoji: '🧑‍🤝‍🧑' },
  { id: 'event', label: 'Event', emoji: '📅' },
  { id: 'other', label: 'Other', emoji: '📌' },
];

export async function render(container, ctx) {
  container.innerHTML = '';
  let selected = 'discussion';
  const chips = h('div', { class: 'chip-row', style: { flexWrap: 'wrap' } },
    TYPES.map((t) => {
      const c = h('button', { class: 'chip', text: `${t.emoji} ${t.label}`, onClick: () => { selected = t.id; refresh(); } });
      return c;
    }));
  function refresh() { [...chips.children].forEach((c, i) => c.classList.toggle('active', TYPES[i].id === selected)); }
  refresh();

  const title = h('input', { class: 'input', placeholder: 'Title (optional)', maxlength: '120' });
  const body = h('textarea', { class: 'textarea', placeholder: 'What’s up in St Andrews? Share the details…', style: { minHeight: '140px' } });
  const submit = h('button', { class: 'btn btn-primary btn-lg', text: 'Post to Forum', onClick: submitPost });

  container.append(
    h('div', { class: 'card', style: { padding: '16px' } },
      h('label', { style: { display: 'block', fontSize: '12.5px', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '8px' }, text: 'Post type' }),
      chips,
      h('div', { class: 'field', style: { marginTop: '16px' } }, h('label', { text: 'Title' }), title),
      h('div', { class: 'field' }, h('label', { text: 'Message' }), body),
      submit,
    ),
  );

  async function submitPost() {
    const v = body.value.trim();
    if (v.length < 2) return toast('Please write something to share.', 'warn');
    submit.disabled = true; submit.textContent = 'Posting…';
    try {
      const out = await api.post('/api/posts', { type: selected, title: title.value.trim() || null, body: v });
      toast('Posted! 🎉', 'success');
      goto('#/post/' + out.post.id);
    } catch (e) { toast(e.message, 'error'); submit.disabled = false; submit.textContent = 'Post to Forum'; }
  }
}
