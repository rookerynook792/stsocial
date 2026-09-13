'use strict';
import { api } from '../api.js';
import { store } from '../store.js';
import { h, emptyState, timeAgo, toast } from '../ui.js';

const ICO = { replies: '💬', event_reminder: '📅', trending: '📈', university: '🎓', town: '🏘️', follow: '🔔', event: '📅' };

export async function render(container, ctx) {
  container.innerHTML = '';
  let d;
  try { d = await api.get('/api/notifications'); }
  catch (e) { container.append(emptyState('⚠️', 'Couldn’t load', e.message)); return; }

  if (d.notifications.length) {
    container.append(h('div', { class: 'flex aic jcb mb-sm' },
      h('span', { class: 'small muted', text: d.unread + ' unread' }),
      h('button', { class: 'btn btn-ghost btn-sm', text: 'Mark all read', onClick: async () => { await api.post('/api/notifications/read-all'); store.unread = 0; ctx.updateUnreadBadge(); render(container, ctx); } })));
  }

  if (!d.notifications.length) {
    container.append(emptyState('🔔', 'No notifications', 'You’re all caught up!'));
  } else {
    const list = h('div', { class: 'card', style: { marginTop: '6px' } });
    d.notifications.forEach((n) => {
      const row = h('a', { class: 'notif' + (n.read ? '' : ' unread'), href: n.link || '#/home', onClick: async () => {
        if (!n.read) { await api.post('/api/notifications/read', { id: n.id }); }
        store.unread = Math.max(0, store.unread - (n.read ? 0 : 1));
        ctx.updateUnreadBadge();
      } },
        h('div', { class: 'n-ico', text: ICO[n.type] || '🔔' }),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { class: 'n-title', text: n.title }),
          h('div', { class: 'n-body', text: n.body }),
          h('div', { class: 'n-time', text: timeAgo(n.created_at) }),
        ),
        n.read ? null : h('span', { class: 'n-dot' }),
      );
      list.append(row);
    });
    container.append(list);
  }

  // prefs
  const prefs = d.prefs || {};
  const labels = { event_reminder: 'Event reminders', replies: 'Replies & comments', trending: 'Trending', university: 'University updates', town: 'Town updates', follows: 'Followed discussions' };
  const prefsCard = h('div', { class: 'card mt', style: { padding: '14px' } },
    h('div', { class: 'section-title', style: { fontSize: '14px', marginBottom: '8px' } }, h('span', { text: '⚙️ Notification preferences' })));
  const order = ['event_reminder', 'replies', 'trending', 'university', 'town', 'follows'];
  const wrap = h('div', { class: 'chip-row', style: { flexWrap: 'wrap' } });
  order.forEach((key) => {
    const on = !!prefs[key];
    const chip = h('button', { class: 'pill-btn' + (on ? ' active' : ''), onClick: () => {
      prefs[key] = !on; chip.classList.toggle('active', !on);
    } }, h('span', { text: on ? '✓ ' : '' }), h('span', { text: labels[key] }));
    wrap.append(chip);
  });
  prefsCard.append(wrap);
  prefsCard.append(h('button', { class: 'btn btn-primary mt-sm', text: 'Save preferences', onClick: async () => {
    try { await api.post('/api/notifications/prefs', { prefs }); toast('Preferences saved', 'success'); }
    catch (e) { toast(e.message, 'error'); }
  } }));
  container.append(prefsCard);
}
