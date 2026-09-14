'use strict';
import { api } from '../api.js';
import { store } from '../store.js';
import { h, emptyState, stars, gradClass, timeAgo, sheet, toast, CAT_LABEL } from '../ui.js';

export async function render(container, ctx) {
  container.innerHTML = '';
  let data;
  try { data = await api.get('/api/town/places/' + ctx.id); }
  catch (e) { container.append(emptyState('📍', 'Place not found', e.message)); return; }
  const p = data.place;
  const isUrl = p.image && /^(https?:|\/)/.test(p.image);
  const hero = h('div', { class: 'detail-hero ' + gradClass(p.image || 'default'), style: { height: '170px', fontSize: '72px' } });
  if (isUrl) hero.append(h('img', { src: p.image, alt: '' }));
  hero.append(h('span', { class: 'goverlay' }), h('span', { text: p.emoji || '📍' }));
  container.append(hero);

  const catLabel = CAT_LABEL[p.category] || p.category || 'local';
  container.append(h('div', { class: 'card mt', style: { padding: '16px' } },
    h('div', { class: 'flex aic jcb' },
      h('h1', { style: { fontSize: '23px' }, text: p.name }),
      p.price ? h('span', { class: 'badge imported', text: p.price }) : null),
    h('div', { class: 'flex aic gap mt-sm' },
      h('span', { class: 'tag-soft', text: '📍 ' + catLabel }),
      p.review_count > 0 ? stars(p.rating) : null,
      p.review_count > 0 ? h('span', { class: 'muted small', text: p.review_count + ' student reviews' }) : h('span', { class: 'muted small', text: 'No student reviews yet' })),
    p.description ? h('p', { class: 'muted', style: { marginTop: '12px' }, text: p.description }) : null,
    p.vibe ? h('div', { class: 'vibe-line', style: { marginTop: '12px' } },
      h('b', { text: 'The vibe: ' }), h('span', { text: p.vibe })) : null,
    infoRows(p),
    p.website || (p.address) ? h('div', { class: 'btn-row mt' },
      p.address ? h('a', { class: 'btn btn-primary', href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((p.name + ', ' + p.address).replace(/,\s*,/g, ','))}`, target: '_blank', rel: 'noopener' }, h('span', { text: '🗺️ Open in Google Maps' })) : null,
      p.website ? h('a', { class: 'btn btn-ghost', href: p.website, target: '_blank', rel: 'noopener' }, h('span', { text: '🌐 Website' })) : null) : null,
  ));

  // “Tons of info” blocks
  if (p.must_try || p.student_tip || p.fun_fact) {
    const info = h('div', { class: 'stack-sm', style: { marginTop: '14px' } });
    if (p.must_try) info.append(infoCard('🍽️', 'Must try', p.must_try));
    if (p.student_tip) info.append(infoCard('🎓', 'Student tip', p.student_tip));
    if (p.fun_fact) info.append(infoCard('💡', 'Fun fact', p.fun_fact));
    container.append(info);
  }

  // reviews
  const reviews = data.reviews;
  const reviewList = h('div', { class: 'stack-sm', style: { marginTop: '10px' } });
  if (!reviews.length) reviewList.append(h('p', { class: 'muted small', text: 'No student reviews yet. Be the first!' }));
  reviews.forEach((r) => reviewList.append(h('div', { class: 'card', style: { padding: '14px' } },
    h('div', { class: 'flex aic jcb' }, h('b', { text: r.author_name || 'Student' }), stars(r.rating)),
    r.body ? h('p', { class: 'muted small', style: { marginTop: '8px' }, text: r.body }) : null,
    h('div', { class: 'faint small', style: { marginTop: '6px' }, text: timeAgo(r.created_at) }),
  )));
  container.append(h('div', { class: 'section-title', style: { marginTop: '22px', fontSize: '16px' }, text: 'Student reviews' }));
  container.append(reviewList);

  if (store.isAuthed) {
    container.append(h('button', { class: 'btn btn-outline mt', text: '✍️ Write a review', onClick: () => reviewSheet(p) }));
  }
}

function infoCard(emoji, title, text) {
  return h('div', { class: 'card', style: { padding: '14px', borderLeft: '4px solid var(--brand)' } },
    h('div', { class: 'flex aic gap' }, h('span', { text: emoji, style: { fontSize: '18px' } }), h('b', { text: title })),
    h('p', { class: 'muted small', style: { marginTop: '6px' }, text }));
}

function infoRows(p) {
  const row = (ico, l, v) => v ? h('div', { class: 'info-row' }, h('div', { class: 'ir-ico', text: ico }),
    h('div', { style: { flex: 1 } }, h('div', { class: 'ir-l', text: l }), h('div', { class: 'ir-v', text: v }))) : null;
  const rows = [row('📍', 'Address', p.address), row('🕑', 'Hours', p.hours)];
  const el = h('div', { style: { marginTop: '14px' } });
  rows.forEach((r) => r && el.append(r));
  return el;
}

function reviewSheet(p) {
  const rating = h('input', { class: 'input', type: 'number', min: '1', max: '5', placeholder: '1–5' });
  const body = h('textarea', { class: 'textarea', placeholder: 'Your review…' });
  const close = sheet({
    title: 'Review ' + p.name,
    body: h('div', { class: 'field' }, h('label', { text: 'Rating (1–5)' }), rating, h('label', { style: { marginTop: '12px' }, text: 'Review' }), body),
    actions: [
      h('button', { class: 'btn btn-ghost', text: 'Cancel', onClick: close }),
      h('button', { class: 'btn btn-primary', text: 'Post review', onClick: async () => {
        const r = Number(rating.value);
        if (!r || r < 1 || r > 5) return toast('Please give a rating from 1 to 5.', 'warn');
        try { await api.post(`/api/town/places/${p.id}/reviews`, { rating: r, body: body.value }); close(); toast('Thanks for your review!', 'success'); location.reload(); }
        catch (e) { toast(e.message, 'error'); }
      } }),
    ],
  });
}
