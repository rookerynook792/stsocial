'use strict';
import { api } from '../api.js';
import { store } from '../store.js';
import { h, toast, goto } from '../ui.js';

export async function render(container, ctx) {
  container.innerHTML = '';
  let mode = 'login';

  const logo = h('div', { class: 'auth-logo' },
    h('div', { class: 'mark', text: 'ST' }),
    h('h1', { class: 'brand-word', text: 'ST SOCIAL' }),
    h('div', { class: 'tag', text: 'St Andrews, Fife, Scotland' }),
  );

  // tab switch
  const tabs = h('div', { class: 'tabs', style: { marginTop: '18px' } },
    h('button', { class: 'tab active', text: 'Sign in', onClick: () => setMode('login') }),
    h('button', { class: 'tab', text: 'Create account', onClick: () => setMode('signup') }),
  );

  const form = h('div', { class: 'card', style: { padding: '16px', marginTop: '14px' } });
  let email, password, name, course, year;
  const submit = h('button', { class: 'btn btn-primary btn-lg', text: 'Sign in' });

  function build() {
    form.innerHTML = '';
    if (mode === 'login') {
      email = h('input', { class: 'input', type: 'email', placeholder: 'Email', autocomplete: 'email' });
      password = h('input', { class: 'input', type: 'password', placeholder: 'Password', autocomplete: 'current-password' });
      form.append(
        h('div', { class: 'field' }, h('label', { text: 'Email' }), email),
        h('div', { class: 'field' }, h('label', { text: 'Password' }), password),
        submit,
        h('div', { class: 'hint center mt-sm', text: 'Use your University of St Andrews email to get the verified badge.' }),
      );
      submit.textContent = 'Sign in';
    } else {
      name = h('input', { class: 'input', placeholder: 'Full name', autocomplete: 'name' });
      email = h('input', { class: 'input', type: 'email', placeholder: 'Email', autocomplete: 'email' });
      password = h('input', { class: 'input', type: 'password', placeholder: 'Password (6+ characters)', autocomplete: 'new-password' });
      course = h('input', { class: 'input', placeholder: 'Course (optional)', autocomplete: 'off' });
      year = h('input', { class: 'input', placeholder: 'Year (optional)', autocomplete: 'off' });
      form.append(
        h('div', { class: 'field' }, h('label', { text: 'Full name' }), name),
        h('div', { class: 'field' }, h('label', { text: 'Email' }), email),
        h('div', { class: 'field' }, h('label', { text: 'Password' }), password),
        h('div', { class: 'grid-2', style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' } },
          h('div', { class: 'field' }, h('label', { text: 'Course' }), course),
          h('div', { class: 'field' }, h('label', { text: 'Year' }), year)),
        submit,
        h('div', { class: 'hint center mt-sm', text: 'A @st-andrews.ac.uk email is verified automatically.' }),
      );
      submit.textContent = 'Create account';
    }
  }

  function setMode(m) {
    mode = m;
    [...tabs.children].forEach((c, i) => c.classList.toggle('active', (i === 0) === (m === 'login')));
    build();
  }

  submit.onclick = async () => {
    submit.disabled = true; submit.textContent = '…';
    try {
      if (mode === 'login') {
        const out = await api.post('/api/auth/login', { email: email.value, password: password.value });
        afterAuth(out);
      } else {
        const out = await api.post('/api/auth/signup', { name: name.value, email: email.value, password: password.value, course: course.value, year: year.value });
        afterAuth(out);
        if (out.verified) toast('🎉 Verified as a St Andrews student!', 'success');
      }
    } catch (e) {
      toast(e.message, 'error');
      submit.disabled = false;
      submit.textContent = mode === 'login' ? 'Sign in' : 'Create account';
    }
  };

  function afterAuth(out) {
    store.setToken(out.token);
    store.setUser(out.user);
    toast('Welcome, ' + out.user.name.split(' ')[0] + '! 🌊', 'success');
    goto('#/home');
  }

  // demo quick logins (demo mode only)
  let meta = store.meta;
  if (!meta) { try { meta = await api.get('/api/meta'); store.meta = meta; } catch { meta = { demoMode: false }; } }
  const demo = meta.demoMode ? h('div', { class: 'demo-creds' },
    h('b', { text: 'Try a demo account' }),
    h('div', { class: 'mt-sm', style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
      h('button', { class: 'btn btn-ghost btn-sm', text: '🎓 Student (verified)', onClick: () => quick('rileyf@st-andrews.ac.uk', 'stsocial123') }),
      h('button', { class: 'btn btn-ghost btn-sm', text: '🛡️ Admin', onClick: () => quick('admin@stsocial.app', 'stsocial-admin') }),
    ),
  ) : null;

  async function quick(em, pw) {
    toast('Signing in…', 'info', 1200);
    try {
      const out = await api.post('/api/auth/login', { email: em, password: pw });
      afterAuth(out);
    } catch (e) { toast(e.message, 'error'); }
  }

  container.append(h('div', { class: 'auth-wrap' }, logo, tabs, form, demo));
  build();
}
