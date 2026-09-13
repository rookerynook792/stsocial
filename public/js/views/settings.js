'use strict';
import { api } from '../api.js';
import { store } from '../store.js';
import { h, toast, goto, avatarNode } from '../ui.js';

const AVATARS = ['🎒', '⚖️', '🏉', '💻', '🌊', '📷', '🎮', '🎸', '📚', '🧘', '🏂', '🍕', '🐻', '🦊', '🌸', '👤'];

export async function render(container, ctx) {
  const u = store.user;
  if (!u) { container.append(h('div', { class: 'empty' }, h('div', { class: 'big', text: '👤' }), h('h3', { text: 'Not signed in' }))); return; }
  container.innerHTML = '';
  let interests = (u.interests || []).join(', ');
  let avatar = u.avatar || '👤';
  let privacy = u.privacy || 'public';

  const name = h('input', { class: 'input', value: u.name });
  const course = h('input', { class: 'input', value: u.course || '', placeholder: 'e.g. BSc Geography' });
  const year = h('input', { class: 'input', value: u.year || '', placeholder: 'e.g. 2nd year' });
  const bio = h('textarea', { class: 'textarea', value: u.bio || '', placeholder: 'A little about you…' });
  const interestInput = h('input', { class: 'input', value: interests, placeholder: 'hiking, photography, rugby' });

  const avatarRow = h('div', { class: 'chip-row', style: { flexWrap: 'wrap' } },
    AVATARS.map((a) => h('button', { class: 'chip' + (avatar === a ? ' active' : ''), text: a, style: { fontSize: '18px' }, onClick: () => { avatar = a; [...avatarRow.children].forEach((c) => c.classList.remove('active')); } })));
  const avatarPrev = h('div', { class: 'avatar lg', style: { alignSelf: 'flex-start' }, text: avatar });

  const privChips = h('div', { class: 'chip-row', style: { flexWrap: 'wrap' } },
    [['public', 'Public'], ['students', 'Students only'], ['private', 'Private']].map(([v, l]) =>
      h('button', { class: 'chip' + (privacy === v ? ' active' : ''), text: l, onClick: () => { privacy = v; [...privChips.children].forEach((c, i) => c.classList.toggle('active', ['public', 'students', 'private'][i] === privacy)); } })));

  container.append(
    h('div', { class: 'card', style: { padding: '16px' } },
      h('div', { class: 'section-title mb-sm' }, h('span', { text: '👤 Profile' })),
      h('div', { class: 'field' }, h('label', { text: 'Avatar' }), avatarPrev, h('div', { class: 'mt-sm' }, avatarRow)),
      h('div', { class: 'field' }, h('label', { text: 'Name' }), name),
      h('div', { class: 'field' }, h('label', { text: 'Username' }), h('input', { class: 'input', value: u.username, disabled: true }), h('div', { class: 'hint', text: 'Your @handle (can’t be changed).' })),
      h('div', { class: 'field' }, h('label', { text: 'Course' }), course),
      h('div', { class: 'field' }, h('label', { text: 'Year' }), year),
      h('div', { class: 'field' }, h('label', { text: 'Bio' }), bio),
      h('div', { class: 'field' }, h('label', { text: 'Interests' }), interestInput, h('div', { class: 'hint', text: 'Comma-separated. Optional — never required.' })),
      h('div', { class: 'field' }, h('label', { text: 'Who can see your profile' }), privChips),
      h('button', { class: 'btn btn-primary', text: 'Save changes', onClick: async () => {
        try {
          const out = await api.put('/api/auth/me', { name: name.value, course: course.value, year: year.value, bio: bio.value, interests: interestInput.value.split(',').map((s) => s.trim()).filter(Boolean), avatar, privacy });
          store.setUser(out.user);
          toast('Profile updated', 'success');
          goto('#/profile/' + out.user.username);
        } catch (e) { toast(e.message, 'error'); }
      } }),
    ),
    h('div', { class: 'card mt', style: { padding: '16px' } },
      h('div', { class: 'section-title mb-sm' }, h('span', { text: '🎓 Verification' })),
      u.verified
        ? h('div', { class: 'univ-badge', style: { width: '100%' }, text: '✓ ST ANDREWS STUDENT' })
        : h('p', { class: 'muted small', text: 'Sign in with your University of St Andrews email to earn the verified badge. Verified status can be extended to more providers later.' }),
    ),
    h('div', { class: 'card mt', style: { padding: '16px' } },
      h('div', { class: 'section-title mb-sm' }, h('span', { text: '🎨 Appearance' })),
      h('div', { class: 'row-item' }, h('div', { class: 'ri-body' }, h('div', { class: 'ri-title', text: 'Dark mode' })),
        h('button', { class: 'pill-btn' + (store.theme === 'dark' ? ' active' : ''), text: store.theme === 'dark' ? '🌙 On' : '☀️ Off', onClick: () => store.toggleTheme() })),
      h('div', { class: 'row-item' }, h('div', { class: 'ri-body' }, h('div', { class: 'ri-title', text: 'Notifications' }), h('div', { class: 'ri-sub', text: 'Manage what you get notified about.' })),
        h('a', { class: 'pill-btn', href: '#/notifications', text: 'Manage' })),
    ),
    h('button', { class: 'btn btn-danger mt', text: '🚪 Sign out', onClick: async () => {
      try { await api.post('/api/auth/logout'); } catch { /* ignore */ }
      store.setToken(null); store.setUser(null);
      toast('Signed out', 'info');
      goto('#/auth');
    } }),
    h('div', { class: 'center faint small', style: { marginTop: '24px' }, text: 'ST SOCIAL v1.0 · St Andrews, Fife' }),
  );
}
