'use strict';
import { api } from '../api.js';
import { store } from '../store.js';
import { h, toast, goto, gradClass, eventCard, dayLabel } from '../ui.js';

const CATS = [
  ['nightlife', 'Nightlife', '🎉'], ['music', 'Music', '🎵'], ['sport', 'Sport', '🏉'],
  ['arts', 'Arts & Culture', '🎭'], ['university', 'University', '🎓'], ['food', 'Food & Drink', '🍔'],
  ['societies', 'Societies', '🧑‍🤝‍🧑'], ['academic', 'Academic', '📚'], ['careers', 'Careers', '💼'],
  ['outdoor', 'Outdoor', '🏖️'], ['charity', 'Charity', '❤️'], ['other', 'Other', '📅'],
];
const EMOJIS = ['🎉', '🎵', '🏉', '🎭', '🎓', '🍔', '🧑‍🤝‍🧑', '📚', '💼', '🏖️', '❤️', '🎳', '🎨', '🍕', '🏈', '🎬'];
const GRADS = ['night', 'ember', 'ocean', 'gold', 'plum', 'grass', 'sky', 'berry'];

export async function render(container, ctx) {
  container.innerHTML = '';
  const today = new Date().toISOString().slice(0, 10);
  let category = 'other';
  let emoji = '🎉';
  let grad = 'night';
  let imageUrl = null;

  const fields = {
    title: h('input', { class: 'input', placeholder: 'Event name', maxlength: '120' }),
    description: h('textarea', { class: 'textarea', placeholder: 'Describe your event…', style: { minHeight: '110px' } }),
    date: h('input', { class: 'input', type: 'date', value: today }),
    start: h('input', { class: 'input', type: 'time', value: '19:00' }),
    end: h('input', { class: 'input', type: 'time', value: '22:00' }),
    location: h('input', { class: 'input', placeholder: 'Where? (e.g. The SA, Tay Park, Castle Street)' }),
    price: h('input', { class: 'input', placeholder: 'Free (or £5, etc.)' }),
    ticket: h('input', { class: 'input', type: 'url', placeholder: 'Ticket / info link (optional)' }),
    contact: h('input', { class: 'input', placeholder: 'Contact (optional)' }),
  };

  // category chips
  const catRow = h('div', { class: 'chip-row', style: { flexWrap: 'wrap' } },
    CATS.map(([id, label, e]) => {
      const c = h('button', { class: 'chip', text: `${e} ${label}`, onClick: () => { category = id; emoji = e; refresh(); } });
      return c;
    }));
  function refresh() { [...catRow.children].forEach((c, i) => c.classList.toggle('active', CATS[i][0] === category)); }
  refresh();

  // emoji picker
  const emojiRow = h('div', { class: 'chip-row', style: { flexWrap: 'wrap' } },
    EMOJIS.map((e) => h('button', { class: 'chip', text: e, style: { fontSize: '18px' }, onClick: () => { emoji = e; refreshEmoji(); } })));
  function refreshEmoji() { [...emojiRow.children].forEach((c, i) => c.classList.toggle('active', EMOJIS[i] === emoji)); }
  refreshEmoji();

  // image upload
  const file = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onChange: async () => {
    const f = file.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try { const out = await api.post('/api/upload', { data: reader.result }); imageUrl = out.url; previewRef.innerHTML = ''; buildPreview(); toast('Image added', 'success'); }
      catch (e) { toast(e.message, 'error'); }
    };
    reader.readAsDataURL(f);
  }});

  function previewEvent() {
    const startMs = new Date(fields.date.value + 'T' + (fields.start.value || '12:00') + ':00').getTime() || Date.now();
    const catObj = CATS.find((c) => c[0] === category);
    return {
      id: 0, title: fields.title.value || 'Untitled event', description: fields.description.value,
      category: { id: category, label: catObj[1], emoji: catObj[2], color: '#4f46e5' },
      start_ms: startMs, end_time: fields.end.value || null, location: fields.location.value || 'St Andrews',
      price: fields.price.value, image: imageUrl || grad, emoji: imageUrl ? null : emoji,
      interested_count: 0, source: { type: 'community' }, my: { interested: false, going: false },
    };
  }
  const previewRef = h('div', { style: { marginTop: '14px' } });
  function buildPreview() {
    previewRef.innerHTML = '';
    const pe = previewEvent();
    previewRef.append(h('div', { class: 'section-title', style: { fontSize: '14px', marginBottom: '10px' }, text: 'Preview' }),
      h('div', { class: 'h-scroll' }, eventCard(pe)));
  }

  const previewBtn = h('button', { class: 'btn btn-outline', text: '👀 Preview', onClick: () => { buildPreview(); previewRef.scrollIntoView({ behavior: 'smooth', block: 'center' }); } });
  const publish = h('button', { class: 'btn btn-primary btn-lg', text: 'Publish event', onClick: publishNow });

  container.append(h('div', { class: 'card', style: { padding: '16px' } },
    h('div', { class: 'field' }, h('label', { text: 'Event name' }), fields.title),
    h('div', { class: 'field' }, h('label', { text: 'Category' }), catRow),
    h('div', { class: 'grid-2', style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' } },
      h('div', { class: 'field' }, h('label', { text: 'Date' }), fields.date),
      h('div', { class: 'field' }, h('label', { text: 'Start' }), fields.start),
    ),
    h('div', { class: 'grid-2', style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' } },
      h('div', { class: 'field' }, h('label', { text: 'End (optional)' }), fields.end),
      h('div', { class: 'field' }, h('label', { text: 'Price' }), fields.price),
    ),
    h('div', { class: 'field' }, h('label', { text: 'Location' }), fields.location),
    h('div', { class: 'field' }, h('label', { text: 'Description' }), fields.description),
    h('div', { class: 'field' }, h('label', { text: 'Ticket / info link' }), fields.ticket),
    h('div', { class: 'field' }, h('label', { text: 'Contact' }), fields.contact),
    h('div', { class: 'field' }, h('label', { text: 'Icon' }), emojiRow),
    h('div', { class: 'field' }, h('label', { text: 'Cover image (optional)' }),
      h('button', { class: 'btn btn-ghost', text: '📷 Upload image', onClick: () => file.click() }), file),
    previewBtn,
    h('div', { class: 'mt-sm' }, publish),
    previewRef,
  ));

  async function publishNow() {
    if (!fields.title.value.trim()) return toast('Please give your event a name.', 'warn');
    if (!fields.location.value.trim()) return toast('Please add a location.', 'warn');
    if (!fields.date.value) return toast('Please choose a date.', 'warn');
    publish.disabled = true; publish.textContent = 'Publishing…';
    const desc = fields.description.value + (fields.contact.value ? '\n\nContact: ' + fields.contact.value : '');
    try {
      const out = await api.post('/api/events', {
        title: fields.title.value, description: desc, date: fields.date.value,
        start_time: fields.start.value || null, end_time: fields.end.value || null,
        location: fields.location.value, category, price: fields.price.value || null,
        ticket_url: fields.ticket.value || null, image: imageUrl, emoji: imageUrl ? null : emoji,
      });
      toast('Event submitted — pending approval by the ST SOCIAL team.', 'success');
      goto('#/event/' + out.event.id);
    } catch (e) { toast(e.message, 'error'); publish.disabled = false; publish.textContent = 'Publish event'; }
  }
}
