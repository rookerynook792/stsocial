'use strict';
import { api } from '../api.js';
import { store } from '../store.js';
import { h, emptyState, avatarNode, eventCard, postCard, verifiedTag, confirmBox, toast, goto } from '../ui.js';

export async function render(container, ctx) {
  container.innerHTML = '';
  const username = ctx.id || (store.user && store.user.username);
  if (!username) { container.append(emptyState('👤', 'Sign in', 'Log in to see your profile.', h('a', { class: 'btn btn-primary mt', style: { width: 'auto' }, href: '#/auth', text: 'Sign in' }))); return; }

  let d;
  try { d = await api.get('/api/profiles/' + username); }
  catch (e) { container.append(emptyState('🔒', 'Profile unavailable', e.message)); return; }
  const u = d.user;
  const isOwner = d.isOwner;

  if (d.limited) {
    container.append(h('div', { class: 'profile-head' },
      avatarNode(u, 'xl'),
      h('div', { class: 'p-name', text: u.name }),
      h('div', { class: 'p-user', text: '@' + u.username }),
      h('p', { class: 'p-bio', style: { marginTop: '16px' }, text: 'This profile is only visible to verified St Andrews students.' }),
    ));
    return;
  }

  // head
  const head = h('div', { class: 'profile-head' },
    avatarNode(u, 'xl'),
    h('div', { class: 'p-name' }, h('span', { text: u.name }), u.verified ? verifiedTag() : null),
    h('div', { class: 'p-user', text: '@' + u.username }),
    (u.course || u.year) ? h('div', { class: 'p-user', style: { marginTop: '2px' }, text: [u.course, u.year].filter(Boolean).join(' · ') }) : null,
    u.bio ? h('p', { class: 'p-bio', text: u.bio }) : null,
    h('div', { class: 'profile-stats' },
      stat(d.stats.postCount, 'Posts'),
      stat(d.stats.interestCount, 'Events'),
      isOwner ? stat(d.stats.createdCount, 'Announced') : stat(d.stats.savedPosts + d.stats.savedEvents, 'Saved'),
    ),
    (u.interests && u.interests.length) ? h('div', { class: 'interest-chips' }, u.interests.map((i) => h('span', { class: 'chip', text: i }))) : null,
  );
  container.append(head);

  // actions
  if (isOwner) {
    container.append(h('div', { class: 'btn-row mt' },
      h('button', { class: 'btn btn-ghost', text: '⚙️ Settings', onClick: () => goto('#/settings') }),
      store.isAdmin ? h('button', { class: 'btn btn-ghost', text: '🛡️ Admin', onClick: () => goto('#/admin') }) : null,
    ));
    // privacy
    const priv = h('div', { class: 'card mt', style: { padding: '14px' } },
      h('div', { class: 'section-title', style: { fontSize: '14px', marginBottom: '10px' } }, h('span', { text: '🔐 Who can see your profile' })),
      h('div', { class: 'chip-row', style: { flexWrap: 'wrap' } },
        privChip('public', 'Public', u.privacy),
        privChip('students', 'Students only', u.privacy),
        privChip('private', 'Private', u.privacy),
      ),
    );
    function privChip(val, label, current) {
      return h('button', { class: 'chip' + (current === val ? ' active' : ''), text: label, onClick: async () => {
        try { await api.put('/api/auth/me', { privacy: val }); toast('Privacy set to ' + label, 'success'); render(container, ctx); }
        catch (e) { toast(e.message, 'error'); }
      } });
    }
    container.append(priv);
  } else {
    container.append(h('div', { class: 'btn-row mt' },
      h('button', { class: 'btn btn-outline', text: '⛔ Block @' + u.username, onClick: () => confirmBox('Block this user? You won’t see their content.', { danger: true, okLabel: 'Block', onOk: async () => { await api.post(`/api/profiles/${u.username}/block`); toast('User blocked', 'success'); goto('#/home'); } }) }),
    ));
  }

  // tabs
  const tabs = ['posts', 'events', ...(isOwner ? ['saved'] : [])];
  let active = 'posts';
  const tabBar = h('div', { class: 'tabs mt' }, tabs.map((t) => h('button', { class: 'tab', text: t[0].toUpperCase() + t.slice(1), onClick: () => { active = t; refresh(); } })));
  const tabBody = h('div', { style: { marginTop: '4px' } });
  container.append(tabBar, tabBody);

  async function refresh() {
    [...tabBar.children].forEach((c, i) => c.classList.toggle('active', tabs[i] === active));
    tabBody.innerHTML = '';
    if (active === 'posts') {
      if (!d.posts.length) tabBody.append(emptyState('💬', 'No posts yet'));
      else d.posts.forEach((p) => tabBody.append(postCard(p)));
    } else if (active === 'events') {
      if (isOwner && d.created.length) {
        tabBody.append(h('div', { class: 'section-title', style: { fontSize: '14px', margin: '6px 2px 10px' }, text: '📣 Your announced events' }));
        d.created.forEach((e) => tabBody.append(h('div', { style: { marginBottom: '10px', position: 'relative' } },
          h('span', { class: 'badge ' + (e.status === 'pending' ? 'community' : 'verified'), style: { position: 'absolute', top: '8px', right: '8px', zIndex: 2 }, text: e.status === 'pending' ? 'Pending approval' : 'Community' }),
          eventCard(e))));
      }
      if (!d.events.length) tabBody.append(emptyState('📅', 'No events yet', 'Mark interest in events to see them here.'));
      else d.events.forEach((e) => tabBody.append(h('div', { style: { marginBottom: '10px' } }, eventCard(e))));
    } else if (active === 'saved') {
      if (d.savedPosts.length) {
        tabBody.append(h('div', { class: 'section-title', style: { fontSize: '14px', margin: '6px 2px 10px' }, text: '🔖 Saved posts' }));
        d.savedPosts.forEach((p) => tabBody.append(postCard(p)));
      }
      if (d.savedEvents.length) {
        tabBody.append(h('div', { class: 'section-title', style: { fontSize: '14px', margin: '16px 2px 10px' }, text: '❤️ Saved events' }));
        d.savedEvents.forEach((e) => tabBody.append(h('div', { style: { marginBottom: '10px' } }, eventCard(e))));
      }
      if (!d.savedPosts.length && !d.savedEvents.length) tabBody.append(emptyState('🔖', 'Nothing saved yet'));
    }
  }
  refresh();
}

function stat(n, l) { return h('div', { class: 'ps' }, h('div', { class: 'n', text: String(n) }), h('div', { class: 'l', text: l })); }
