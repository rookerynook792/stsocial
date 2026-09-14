'use strict';
import { api } from '../api.js';
import { store } from '../store.js';
import { h, eventCard, postCard, updateCard, emptyState, skeletonList, timeAgo, eventWhenLabel, goto } from '../ui.js';

function secHead(title, emoji, link) {
  return h('div', { class: 'section-head' },
    h('div', { class: 'section-title' }, h('span', { class: 'emoji', text: emoji }), h('span', { text: title })),
    link ? h('a', { class: 'section-link', href: link.hash, text: link.label }) : null,
  );
}

function eventRow(evt) {
  const a = h('a', { class: 'card event-row', href: '#/event/' + evt.id });
  const isUrl = evt.image && /^(https?:|\/)/.test(evt.image);
  const thumb = h('div', { class: 'thumb g-' + (evt.image || 'default') });
  if (isUrl) thumb.append(h('img', { src: evt.image, alt: '' }));
  else thumb.append(document.createTextNode(evt.emoji || '📅'));
  a.append(thumb, h('div', { class: 'er-body' },
    h('div', { class: 'er-title', text: evt.title }),
    h('div', { class: 'er-meta' }, h('span', { text: eventWhenLabel(evt) }), ' · ', h('span', { text: evt.location })),
    h('div', { class: 'er-meta', style: { marginTop: '6px' } },
      h('span', { class: 'cat-badge', style: { background: evt.category.color + 'cc' }, html: `${evt.category.emoji} ${evt.category.label}` }),
      ' ', h('span', { class: 'muted small', text: '❤ ' + evt.interested_count }),
    ),
  ));
  return a;
}

export async function render(container, ctx) {
  container.append(skeletonList(4));
  let d;
  try { d = await api.get('/api/home'); }
  catch (e) { container.innerHTML = ''; container.append(emptyState('🛰️', 'Couldn’t load', e.message)); return; }
  container.innerHTML = '';

  // hero
  const hero = h('div', { class: 'hero' },
    h('span', { class: 'h-loc', text: '📍 St Andrews, Fife' }),
    h('h1', { text: d.greeting }),
    h('p', { text: d.question }),
    h('div', { class: 'h-time' },
      h('span', { text: d.now.date }),
      d.lastIngest ? h('span', { text: '  ·  feed updated ' + timeAgo(d.lastIngest.at) }) : null,
    ),
  );
  container.append(hero);

  // explore guide card
  container.append(h('a', { class: 'card explore-card', href: '#/explore' },
    h('div', { class: 'ec-ico', text: '🧭' }),
    h('div', { style: { flex: 1, minWidth: 0 } },
      h('div', { class: 'ec-t' }, 'Explore St Andrews', h('span', { class: 'ec-new', text: 'NEW' })),
      h('div', { class: 'ec-d', text: '1,100 years of history, 10 fun facts, 15 things to do — plus every pub and eatery, deep. The go-to guide for students.' })),
    h('div', { class: 'ec-arrow', text: '→' }),
  ));

  // happening now
  if (d.happeningNow && d.happeningNow.length) {
    container.append(h('div', { class: 'section' },
      secHead('Happening now', '⚡', { hash: '#/events?filter=today', label: 'Today' }),
      h('div', { class: 'h-scroll' }, d.happeningNow.map((e) => eventCard(e))),
    ));
  }

  // happening today
  container.append(h('div', { class: 'section' },
    secHead('Happening today', '📅', { hash: '#/events?filter=today', label: 'See all' }),
    d.happeningToday.length
      ? h('div', { class: 'h-scroll' }, d.happeningToday.map((e) => eventCard(e)))
      : emptyState('🌙', 'Nothing on today', 'Check out what’s coming up this week.', h('a', { class: 'btn btn-primary mt', style: { width: 'auto' }, href: '#/events?filter=week', text: 'Browse events' })),
  ));

  // quick actions
  container.append(h('div', { class: 'section' },
    secHead('Quick actions', '⚡'),
    h('div', { class: 'qa-grid' }, d.quickActions.map((qa) =>
      h('a', { class: 'qa', href: qa.link },
        h('span', { class: 'qa-ico', style: { background: 'var(--brand-soft)' }, text: qa.emoji }),
        h('span', { class: 'qa-t', text: qa.label }),
      ),
    )),
  ));

  // coming up
  if (d.comingUp && d.comingUp.length) {
    container.append(h('div', { class: 'section' },
      secHead('Coming up', '✨', { hash: '#/events?filter=week', label: 'See all' }),
      h('div', { class: 'stack-sm' }, d.comingUp.slice(0, 5).map((e) => eventRow(e))),
    ));
  }

  // town + university
  const updatesRow = h('div', { class: 'section' },
    secHead('Around town', '🏘️', { hash: '#/town', label: 'Town hub' }),
    h('div', { class: 'stack-sm' }, (d.townUpdates || []).slice(0, 2).map((u) => updateCard(u, { kind: 'town' }))),
  );
  container.append(updatesRow);

  if (d.universityUpdates && d.universityUpdates.length) {
    container.append(h('div', { class: 'section' },
      secHead('University', '🎓', { hash: '#/university', label: 'All updates' }),
      h('div', { class: 'stack-sm' }, d.universityUpdates.slice(0, 2).map((u) => updateCard(u, { kind: 'university' }))),
    ));
  }

  // forum
  if (d.forumActivity && d.forumActivity.length) {
    container.append(h('div', { class: 'section' },
      secHead('From the forum', '💬', { hash: '#/forum', label: 'Join in' }),
      h('div', { class: 'stack-sm' }, d.forumActivity.slice(0, 3).map((p) => postCard(p))),
    ));
  }

  container.append(h('div', { class: 'center faint small', style: { marginTop: '30px', paddingBottom: '10px' },
    text: store.meta && store.meta.demoMode ? 'DEMO DATA · ST SOCIAL · St Andrews' : 'ST SOCIAL · St Andrews' }));
}
