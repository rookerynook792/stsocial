'use strict';
import { api } from '../api.js';
import { store } from '../store.js';
import { h, emptyState, sourceBadge, catBadge, demoChip, dayLabel, fmtTime, fmtClock, isHappeningNow, goto, sheet, toast } from '../ui.js';

function infoRow(ico, label, value, href) {
  const v = value;
  const body = h('div', { style: { minWidth: 0, flex: 1 } },
    h('div', { class: 'ir-l', text: label }),
    href ? h('a', { class: 'ir-v', href, text: v }) : h('div', { class: 'ir-v', text: v }),
  );
  return h('div', { class: 'info-row' }, h('div', { class: 'ir-ico', text: ico }), body);
}

function interestPill(evt, type, label) {
  const active = evt.my && evt.my[type];
  const node = h('button', {
    class: 'btn ' + (active ? 'btn-primary' : 'btn-ghost'),
    onClick: async () => {
      if (!store.isAuthed) return goto('auth');
      try {
        const out = await api.post(`/api/events/${evt.id}/interest`, { type });
        evt.interested_count = out.event.interested_count;
        evt.going_count = out.event.going_count;
        evt.my = out.event.my;
        render(containerRef, ctxRef);
      } catch (e) { /* toast */ }
    },
  }, h('span', { text: active ? '✓ ' : '' }), h('span', { text: label }), h('span', { class: 'muted', text: (type === 'going' ? evt.going_count : evt.interested_count) || '' }));
  return node;
}
let containerRef, ctxRef;

export async function render(container, ctx) {
  containerRef = container; ctxRef = ctx;
  let evt;
  try { evt = (await api.get('/api/events/' + ctx.id)).event; }
  catch (e) { container.innerHTML = ''; container.append(emptyState('🗓️', 'Event unavailable', e.message)); return; }
  container.innerHTML = '';

  const live = isHappeningNow(evt);
  const isUrl = evt.image && /^(https?:|\/)/.test(evt.image);
  const hero = h('div', { class: 'detail-hero g-' + (evt.image || 'default') });
  if (isUrl) hero.append(h('img', { src: evt.image, alt: '' }));
  hero.append(h('span', { class: 'goverlay' }), h('span', { text: evt.emoji || '📅' }));
  const tags = h('div', { class: 'dh-tags' }, catBadge(evt.category, { solid: false }), sourceBadge(evt, { solid: true }));
  if (evt.is_demo) tags.append(demoChip());
  if (live) tags.append(h('span', { class: 'badge demo solid' }, h('span', { class: 'd', style: { width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block' } }), ' LIVE'));
  hero.append(tags);
  container.append(hero);

  // title + actions
  container.append(h('div', { class: 'card', style: { marginTop: '14px', padding: '16px' } },
    h('div', { style: { display: 'flex', gap: '10px', alignItems: 'flex-start' } },
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('h1', { style: { fontSize: '23px', letterSpacing: '-.02em' }, text: evt.title }),
        h('div', { class: 'muted small', style: { marginTop: '6px', fontWeight: 700 } },
          h('span', { text: `${dayLabel(evt.start_ms)} · ${fmtTime(evt.start_ms)}` }),
          evt.end_time ? h('span', { text: ` – ${fmtClock(evt.end_time)}` }) : null,
        ),
      ),
      h('button', { class: 'icon-btn', 'aria-label': 'Share', text: '↗', onClick: () => share(evt) }),
    ),
    evt.description ? h('p', { class: 'muted', style: { marginTop: '14px', fontSize: '15px' }, text: evt.description }) : null,
    h('div', { class: 'btn-row mt' },
      interestPill(evt, 'interested', 'Interested'),
      interestPill(evt, 'going', 'Going'),
    ),
    h('div', { class: 'center small', style: { marginTop: '12px', color: 'var(--text-dim)', fontWeight: 700 },
      text: evt.interested_count > 0 ? `${evt.interested_count} ST SOCIAL student${evt.interested_count === 1 ? '' : 's'} are interested` : 'Be the first to mark interest' }),
  ));

  // info
  container.append(h('div', { class: 'card mt', style: { padding: '6px 16px' } },
    infoRow('📅', 'Date', dayLabel(evt.start_ms)),
    infoRow('🕑', 'Time', `${fmtTime(evt.start_ms)}${evt.end_time ? ' – ' + fmtClock(evt.end_time) : ''}`),
    infoRow('📍', 'Location', evt.location, '#/map'),
    evt.price ? infoRow('🎟️', 'Price', evt.price) : infoRow('🎟️', 'Price', 'Free'),
    infoRow('🧑‍🤝‍🧑', 'Organiser', evt.organizer || '—'),
  ));

  if (evt.ticket_url) {
    container.append(h('a', { class: 'btn btn-primary mt', style: { width: '100%' }, href: evt.ticket_url, target: '_blank', rel: 'noopener' },
      h('span', { text: '🎫 Get tickets / Learn more' })));
  }

  // source
  const src = evt.source;
  const srcCard = h('div', { class: 'card mt', style: { padding: '14px 16px' } },
    h('div', { class: 'section-title', style: { fontSize: '14px' } }, h('span', { text: 'ℹ️ Source' })),
    h('div', { class: 'muted small', style: { marginTop: '8px' } },
      src.official ? 'Official University of St Andrews listing.'
        : src.verified ? 'Verified source — high reliability.'
          : src.imported ? 'Automatically imported from an approved source.'
            : 'Community posted by a student.'),
    src.name ? h('div', { class: 'small', style: { marginTop: '6px', color: 'var(--text-faint)' }, text: 'From: ' + src.name }) : null,
    (src.sources && src.sources.length > 1) ? h('div', { class: 'small', style: { marginTop: '6px', color: 'var(--text-faint)' },
      text: 'Merged from ' + src.sources.length + ' sources: ' + src.sources.map((s) => s.name).join(', ') }) : null,
  );
  container.append(srcCard);

  // community event label + report
  if (evt.source.type === 'community') {
    container.append(h('div', { class: 'univ-badge', style: { background: 'var(--warn-soft)', color: 'var(--warn)', marginTop: '14px', width: '100%' },
      text: '👥 COMMUNITY EVENT' }));
  }
  if (store.isAuthed) {
    container.append(h('div', { class: 'btn-row mt' },
      h('button', { class: 'btn btn-outline', text: '⚠ Report this event', onClick: () => reportSheet(evt) }),
    ));
  }
}

async function share(evt) {
  const url = window.location.href;
  const text = `${evt.title} — ${dayLabel(evt.start_ms)} at ${fmtTime(evt.start_ms)}, ${evt.location} (via ST SOCIAL)`;
  if (navigator.share) { try { await navigator.share({ title: evt.title, text, url }); return; } catch { /* cancelled */ } }
  try { await navigator.clipboard.writeText(text + ' ' + url); alert('Copied to clipboard: ' + text); }
  catch { alert(text); }
}

function reportSheet(evt) {
  const reasons = ['misleading', 'spam', 'inappropriate', 'duplicate', 'unsafe', 'other'];
  const sel = h('select', { class: 'select' }, reasons.map((r) => h('option', { value: r, text: r })));
  const details = h('textarea', { class: 'textarea', placeholder: 'Tell us more (optional)' });
  const close = sheet({
    title: 'Report event',
    body: h('div', { class: 'field' },
      h('label', { text: 'Reason' }), sel,
      h('label', { style: { marginTop: '12px' }, text: 'Details' }), details,
    ),
    actions: [
      h('button', { class: 'btn btn-ghost', text: 'Cancel', onClick: close }),
      h('button', { class: 'btn btn-danger', text: 'Submit report', onClick: async () => {
        try {
          await api.post(`/api/events/${evt.id}/report`, { reason: sel.value, details: details.value });
          close();
          toast('Thanks — our team will review this event.', 'success');
        } catch (e) { toast(e.message, 'error'); }
      } }),
    ],
  });
}
