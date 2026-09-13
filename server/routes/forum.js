'use strict';
const express = require('express');
const { db } = require('../db');
const { postToApi, commentToApi } = require('./common');
const { requireAuth } = require('../auth');
const { POST_TYPES } = require('../util');
const { notify } = require('../notify');

const r = express.Router();

const BASE = `
  SELECT p.*, (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status='published') AS cc
  FROM posts p
  WHERE p.status = 'published'
`;

function buildList(tab, type) {
  let where = '';
  let order = 'p.created_at DESC';
  if (tab === 'trending') order = '(p.upvotes - p.downvotes) + MIN(cc, 30) DESC, p.created_at DESC';
  else if (tab === 'latest') order = 'p.created_at DESC';
  else if (tab === 'discussed') order = 'cc DESC, p.created_at DESC';
  else if (tab === 'events') where = " AND p.type = 'event'";
  else if (tab === 'questions') where = " AND p.type = 'question'";
  if (type) where = ` AND p.type = '${type.replace(/'/g, '')}'`;
  return { where, order };
}

// GET /api/forum
r.get('/forum', (req, res) => {
  const { tab = 'trending', type } = req.query;
  const { where, order } = buildList(tab, type);
  const rows = db.prepare(BASE + where + ` ORDER BY ${order} LIMIT 200`).all();
  res.json({
    posts: rows.map((p) => postToApi(p, req.userId)),
    tab,
    tabs: [
      { id: 'trending', label: 'Trending' }, { id: 'latest', label: 'Latest' },
      { id: 'discussed', label: 'Most Discussed' }, { id: 'events', label: 'Events' },
      { id: 'questions', label: 'Questions' },
    ],
    types: POST_TYPES.map((t) => ({ id: t.id, label: t.label, emoji: t.emoji })),
  });
});

// GET /api/posts/:id
r.get('/posts/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM posts WHERE id = ? AND status = ?').get(req.params.id, 'published');
  if (!row) return res.status(404).json({ error: 'Post not found.' });
  const post = postToApi(row, req.userId);
  const comments = db.prepare(`SELECT * FROM comments WHERE post_id = ? AND status = 'published' ORDER BY created_at ASC`).all(row.id);
  const byId = {};
  const tree = [];
  for (const c of comments) { byId[c.id] = { ...commentToApi(c), replies: [] }; }
  for (const c of comments) {
    const node = byId[c.id];
    if (c.parent_id && byId[c.parent_id]) byId[c.parent_id].replies.push(node);
    else tree.push(node);
  }
  res.json({ post, comments: tree });
});

// POST /api/posts
r.post('/posts', requireAuth, (req, res) => {
  const { type = 'discussion', title, body, event_id } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Please write something to share.' });
  const res2 = db.prepare(`
    INSERT INTO posts (user_id, type, title, body, event_id, created_at, approved, status, is_demo)
    VALUES (?,?,?,?,?,?,1,'published',0)
  `).run(req.userId, POST_TYPES.some((t) => t.id === type) ? type : 'other', title || null, String(body).trim(), event_id || null, Date.now());
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(res2.lastInsertRowid);
  res.status(201).json({ post: postToApi(row, req.userId) });
});

// POST /api/posts/:id/vote  { value: 1 | -1 }
r.post('/posts/:id/vote', requireAuth, (req, res) => {
  const value = Number(req.body && req.body.value);
  if (![1, -1].includes(value)) return res.status(400).json({ error: 'Bad vote.' });
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Post not found.' });
  const prev = db.prepare('SELECT value FROM post_votes WHERE user_id=? AND post_id=?').get(req.userId, row.id);
  if (prev && prev.value === value) {
    db.prepare('DELETE FROM post_votes WHERE user_id=? AND post_id=?').run(req.userId, row.id);
  } else {
    db.prepare('INSERT INTO post_votes (user_id, post_id, value) VALUES (?,?,?) ON CONFLICT(user_id,post_id) DO UPDATE SET value = excluded.value')
      .run(req.userId, row.id, value);
  }
  const up = db.prepare('SELECT COUNT(*) c FROM post_votes WHERE post_id=? AND value=1').get(row.id).c;
  const down = db.prepare('SELECT COUNT(*) c FROM post_votes WHERE post_id=? AND value=-1').get(row.id).c;
  db.prepare('UPDATE posts SET upvotes=?, downvotes=? WHERE id=?').run(up, down, row.id);
  const fresh = db.prepare('SELECT * FROM posts WHERE id=?').get(row.id);
  res.json({ post: postToApi(fresh, req.userId) });
});

// POST /api/posts/:id/save
r.post('/posts/:id/save', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Post not found.' });
  const exists = db.prepare('SELECT 1 FROM post_saves WHERE user_id=? AND post_id=?').get(req.userId, row.id);
  if (exists) db.prepare('DELETE FROM post_saves WHERE user_id=? AND post_id=?').run(req.userId, row.id);
  else db.prepare('INSERT INTO post_saves (user_id, post_id, created_at) VALUES (?,?,?)').run(req.userId, row.id, Date.now());
  const fresh = db.prepare('SELECT * FROM posts WHERE id=?').get(row.id);
  res.json({ post: postToApi(fresh, req.userId) });
});

// POST /api/posts/:id/follow
r.post('/posts/:id/follow', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Post not found.' });
  const exists = db.prepare('SELECT 1 FROM post_follows WHERE user_id=? AND post_id=?').get(req.userId, row.id);
  let following;
  if (exists) { db.prepare('DELETE FROM post_follows WHERE user_id=? AND post_id=?').run(req.userId, row.id); following = false; }
  else { db.prepare('INSERT INTO post_follows (user_id, post_id, created_at) VALUES (?,?,?)').run(req.userId, row.id, Date.now()); following = true; }
  res.json({ following });
});

// POST /api/posts/:id/report
r.post('/posts/:id/report', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Post not found.' });
  db.prepare('INSERT INTO reports (target_type, target_id, reporter_id, reason, details, status, created_at) VALUES (?,?,?,?,?,\'pending\',?)')
    .run('post', row.id, req.userId, (req.body && req.body.reason) || 'other', (req.body && req.body.details) || '', Date.now());
  res.json({ ok: true, message: 'Thanks — our team will review this post.' });
});

// POST /api/posts/:id/remove (author or admin)
r.post('/posts/:id/remove', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Post not found.' });
  if (row.user_id !== req.userId && req.user.role !== 'admin') return res.status(403).json({ error: 'Not allowed.' });
  db.prepare(`UPDATE posts SET status='removed', approved=0 WHERE id=?`).run(row.id);
  res.json({ ok: true });
});

/* --------------------------------- comments -------------------------------- */

// GET /api/posts/:id/comments
r.get('/posts/:id/comments', (req, res) => {
  const rows = db.prepare(`SELECT * FROM comments WHERE post_id=? AND status='published' ORDER BY created_at ASC`).all(req.params.id);
  res.json({ comments: rows.map(commentToApi) });
});

// POST /api/comments
r.post('/comments', requireAuth, (req, res) => {
  const { post_id, body, parent_id } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Please write a comment.' });
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(post_id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  let parentId = parent_id || null;
  if (parentId) {
    const parent = db.prepare('SELECT * FROM comments WHERE id=?').get(parentId);
    if (!parent) parentId = null;
  }
  const res2 = db.prepare(`INSERT INTO comments (post_id, user_id, parent_id, body, created_at, approved, status) VALUES (?,?,?,?,?,1,'published')`)
    .run(post.id, req.userId, parentId, String(body).trim(), Date.now());
  const row = db.prepare('SELECT * FROM comments WHERE id=?').get(res2.lastInsertRowid);
  // Notifications: notify post author on new top-level comment; comment author on a reply.
  if (!parentId) {
    if (post.user_id !== req.userId) notify(post.user_id, 'replies', 'New reply on your post', `${req.user.name} commented on "${post.title || post.body.slice(0, 40)}"`, `#/post/${post.id}`);
  } else {
    const parent = db.prepare('SELECT * FROM comments WHERE id=?').get(parentId);
    if (parent && parent.user_id !== req.userId) notify(parent.user_id, 'replies', 'New reply to your comment', `${req.user.name} replied to you on "${post.title || 'a discussion'}"`, `#/post/${post.id}`);
    if (post.user_id !== req.userId && post.user_id !== (parentId && db.prepare('SELECT user_id FROM comments WHERE id=?').get(parentId).user_id)) {
      notify(post.user_id, 'replies', 'New reply on your post', `${req.user.name} joined the thread on "${post.title || post.body.slice(0, 40)}"`, `#/post/${post.id}`);
    }
  }
  res.status(201).json({ comment: commentToApi(row) });
});

// POST /api/comments/:id/vote
r.post('/comments/:id/vote', requireAuth, (req, res) => {
  const value = Number(req.body && req.body.value);
  if (![1, -1].includes(value)) return res.status(400).json({ error: 'Bad vote.' });
  const row = db.prepare('SELECT * FROM comments WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Comment not found.' });
  db.prepare('INSERT INTO comment_votes (user_id, comment_id, value) VALUES (?,?,?) ON CONFLICT(user_id,comment_id) DO UPDATE SET value = excluded.value')
    .run(req.userId, row.id, value);
  const up = db.prepare('SELECT COUNT(*) c FROM comment_votes WHERE comment_id=? AND value=1').get(row.id).c;
  db.prepare('UPDATE comments SET upvotes=? WHERE id=?').run(up, row.id);
  res.json({ comment: commentToApi(db.prepare('SELECT * FROM comments WHERE id=?').get(row.id)) });
});

module.exports = r;
