'use strict';
import { api } from '../api.js';
import { store } from '../store.js';
import { h, emptyState, avatarNode, timeAgo, goto, sheet, toast } from '../ui.js';

let V = null, C = null, state = null;

export function render(container, ctx) { return base(container, ctx); }
function rerender() { return base(V, C); }

async function base(container, ctx) {
  V = container; C = ctx;
  container.innerHTML = '';
  let data;
  try { data = await api.get('/api/posts/' + ctx.id); }
  catch (e) { container.append(emptyState('💬', 'Post unavailable', e.message)); return; }
  state = data;
  const post = data.post;

  const rail = h('div', { class: 'vote' },
    h('button', { class: 'up' + (post.my_vote === 1 ? ' active' : ''), text: '▲', onClick: () => vote(post, 1, rail) }),
    h('span', { class: 'count', text: String(post.score), id: 'post-count' }),
    h('button', { class: 'down' + (post.my_vote === -1 ? ' active' : ''), text: '▼', onClick: () => vote(post, -1, rail) }),
  );

  const head = h('div', { class: 'post-head' },
    h('a', { href: '#/profile/' + (post.author ? post.author.username : 'x'), style: { display: 'contents' } }, avatarNode(post.author)),
    h('div', { class: 'who' },
      h('div', { class: 'name' },
        h('a', { href: '#/profile/' + (post.author ? post.author.username : 'x'), text: post.author ? post.author.name : 'Student' }),
        post.author && post.author.verified ? h('span', { class: 'verified-tick', style: { position: 'static', width: '14px', height: '14px', display: 'inline-grid' }, text: '✓' }) : null,
      ),
      h('div', { class: 'sub' }, '@' + (post.author ? post.author.username : '') + '  ·  ' + timeAgo(post.created_at)),
    ),
    h('span', { class: 'type-tag' }, post.type.emoji, ' ', post.type.label),
  );

  const body = h('div', {},
    post.title ? h('h1', { class: 'post-title', style: { fontSize: '22px', marginBottom: '10px' }, text: post.title }) : null,
    h('p', { class: 'post-body full', text: post.body }),
  );

  const saveBtn = h('span', { class: 'pf' + (post.saved ? ' active' : ''), text: '🔖 Save', onClick: () => toggleSave(post, saveBtn) });
  const followBtn = h('span', { class: 'pf' + (post.following ? ' active' : ''), text: post.following ? '✓ Following' : '＋ Follow', onClick: () => toggleFollow(post, followBtn) });
  const foot = h('div', { class: 'post-foot', style: { border: '1px solid var(--border)', borderRadius: '14px', marginTop: '14px', padding: '4px' } },
    h('span', { class: 'pf' }, '💬 <b id="c-count">' + post.comments + '</b>'),
    saveBtn, followBtn,
    h('span', { class: 'pf', style: { marginLeft: 'auto' }, text: '↗ Share', onClick: () => sharePost(post) }),
    h('span', { class: 'pf', title: 'Report', text: '⚠', onClick: () => reportSheet(post) }),
  );
  // fix the comment-count span (built with text, not html)
  foot.children[0].innerHTML = '💬 <b>' + post.comments + '</b>';

  const card = h('div', { class: 'card', style: { padding: '16px', display: 'flex', gap: '14px' } }, rail, h('div', { style: { flex: 1, minWidth: '0' } }, head, body, foot));
  container.append(card);

  if (post.event_id) {
    container.append(h('a', { class: 'card mt', style: { padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }, href: '#/event/' + post.event_id },
      h('span', { text: '📅' }), h('span', { class: 'small', text: 'Linked event — tap to view' })));
  }

  container.append(h('div', { class: 'section-title', style: { margin: '22px 2px 4px', fontSize: '16px' }, text: '💬 Comments' }));
  const commentsEl = h('div', { style: { borderBottom: '1px solid var(--border)' } });
  if (!data.comments.length) commentsEl.append(h('p', { class: 'muted small', style: { padding: '14px 2px' }, text: 'No comments yet. Start the conversation.' }));
  data.comments.forEach((c) => commentsEl.append(commentNode(c)));
  container.append(commentsEl);

  const ta = h('textarea', { class: 'textarea', placeholder: 'Write a comment…' });
  const send = h('button', { class: 'btn btn-primary btn-sm', style: { alignSelf: 'flex-end' }, text: 'Comment',
    onClick: async () => {
      const v = ta.value.trim(); if (!v) return;
      send.disabled = true;
      try { await api.post('/api/comments', { post_id: post.id, body: v }); ta.value = ''; rerender(); }
      catch (e) { toast(e.message, 'error'); send.disabled = false; }
    } });
  container.append(h('div', { class: 'mt', style: { display: 'flex', gap: '10px', alignItems: 'flex-end' } },
    h('div', { style: { flex: '1' } }, ta), send));
}

function commentNode(c) {
  const replyBtn = h('span', { class: 'pf', style: { padding: '2px 6px' }, text: 'Reply' });
  let replyTa = null;
  const node = h('div', { class: 'comment' },
    avatarNode(c.author, 'sm'),
    h('div', { class: 'c-body' },
      h('div', { class: 'c-name' },
        h('a', { href: '#/profile/' + (c.author ? c.author.username : 'x'), text: c.author ? c.author.name : 'Student' }),
        c.author && c.author.verified ? h('span', { class: 'verified-tick', style: { position: 'static', width: '14px', height: '14px', display: 'inline-grid' }, text: '✓' }) : null,
      ),
      h('div', { class: 'c-text', text: c.body }),
      h('div', { class: 'c-foot' },
        h('span', { text: timeAgo(c.created_at) }),
        replyBtn,
        h('span', { class: 'pf', style: { padding: '2px 4px', onClick: () => voteComment(c) } }, '▲ <b id="cv-' + c.id + '">' + c.upvotes + '</b>'),
      ),
      c.replies.length ? h('div', { style: { borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '6px' } }, c.replies.map((r) => commentNode(r))) : null,
    ),
  );
  replyBtn.onclick = () => {
    if (replyTa) { replyTa.remove(); replyBtn.textContent = 'Reply'; replyTa = null; return; }
    replyBtn.textContent = 'Cancel';
    replyTa = h('div', { style: { display: 'flex', gap: '8px', alignItems: 'flex-end', marginTop: '8px' } },
      h('textarea', { class: 'textarea', placeholder: 'Reply…', style: { minHeight: '58px', flex: '1' } }),
      h('button', { class: 'btn btn-primary btn-sm', text: '↩', onClick: async () => {
        const v = replyTa.querySelector('textarea').value.trim(); if (!v) return;
        try { await api.post('/api/comments', { post_id: state.post.id, body: v, parent_id: c.id }); rerender(); }
        catch (er) { toast(er.message, 'error'); }
      } }),
    );
    node.querySelector('.c-body').append(replyTa);
  };
  return node;
}

async function vote(post, value, rail) {
  if (!store.isAuthed) return goto('auth');
  try {
    const out = await api.post(`/api/posts/${post.id}/vote`, { value });
    document.getElementById('post-count').textContent = String(out.post.score);
    rail.querySelector('.up').classList.toggle('active', out.post.my_vote === 1);
    rail.querySelector('.down').classList.toggle('active', out.post.my_vote === -1);
  } catch (e) { toast(e.message, 'error'); }
}
async function toggleSave(post, btn) {
  if (!store.isAuthed) return goto('auth');
  try {
    const out = await api.post(`/api/posts/${post.id}/save`);
    post.saved = out.post.saved;
    btn.classList.toggle('active', post.saved);
    toast(post.saved ? 'Saved to your profile' : 'Removed from saved', 'success');
  } catch (e) { toast(e.message, 'error'); }
}
async function toggleFollow(post, btn) {
  if (!store.isAuthed) return goto('auth');
  try {
    const out = await api.post(`/api/posts/${post.id}/follow`);
    post.following = out.following;
    btn.classList.toggle('active', post.following);
    btn.textContent = post.following ? '✓ Following' : '＋ Follow';
  } catch (e) { toast(e.message, 'error'); }
}
async function voteComment(c) {
  if (!store.isAuthed) return goto('auth');
  try {
    const out = await api.post(`/api/comments/${c.id}/vote`, { value: 1 });
    const el = document.getElementById('cv-' + c.id); if (el) el.innerHTML = '▲ <b>' + out.comment.upvotes + '</b>';
  } catch (e) { toast(e.message, 'error'); }
}
function sharePost(post) {
  const url = window.location.href;
  const text = (post.title || post.body.slice(0, 80)) + ' (via ST SOCIAL)';
  if (navigator.share) { navigator.share({ title: text, text, url }).catch(() => {}); return; }
  (navigator.clipboard ? navigator.clipboard.writeText(text + ' ' + url) : Promise.resolve()).then(() => toast('Link copied', 'success')).catch(() => {});
}
function reportSheet(post) {
  const reasons = ['spam', 'offensive', 'misleading', 'bullying', 'off-topic', 'other'];
  const sel = h('select', { class: 'select' }, reasons.map((r) => h('option', { value: r, text: r })));
  const close = sheet({
    title: 'Report post',
    body: h('div', { class: 'field' }, h('label', { text: 'Reason' }), sel),
    actions: [
      h('button', { class: 'btn btn-ghost', text: 'Cancel', onClick: close }),
      h('button', { class: 'btn btn-danger', text: 'Submit', onClick: async () => {
        try { await api.post(`/api/posts/${post.id}/report`, { reason: sel.value }); close(); toast('Reported. Thanks for keeping ST SOCIAL safe.', 'success'); }
        catch (e) { toast(e.message, 'error'); }
      } }),
    ],
  });
}
