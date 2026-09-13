'use strict';
const express = require('express');
const { db } = require('../db');
const { eventToApi, postToApi } = require('./common');
const { startOfDay } = require('../util');

const r = express.Router();
const DAY = 86400000;

function visibleUsers(where, params) {
  // Respect privacy: never list 'private'; 'students'-only only to signed-in students.
  let priv = `u.privacy = 'public'`;
  if (reqIsStudent()) priv = `(u.privacy = 'public' OR u.privacy = 'students')`;
  return where.replace('@PRIV@', priv);
}
function reqIsStudent() {
  return !!(searchState.user && searchState.user.verified);
}
// small context holder set per request in the route
let searchState = { user: null };

function like(q, ...cols) {
  const clause = cols.map((c) => `${c} LIKE ?`).join(' OR ');
  const params = cols.map(() => `%${q}%`);
  return { clause, params };
}

// GET /api/search
r.get('/', (req, res) => {
  const q = String(req.query.q || '').trim();
  const type = req.query.type || 'all';
  searchState.user = req.user;
  if (q.length < 2) return res.json({ q, type, results: empty(), suggestions: [] });
  const out = empty();
  const t0 = startOfDay(Date.now());
  const only = (t) => type === 'all' || type === t;

  if (only('events')) {
    const e = like(q, 'title', 'description', 'location', 'organizer');
    out.events = db.prepare(`SELECT * FROM events WHERE status='published' AND approved=1 AND start_ms>=? AND (${e.clause}) ORDER BY start_ms ASC LIMIT 6`)
      .all(t0 - DAY, ...e.params).map((x) => eventToApi(x, req.userId));
  }
  if (only('posts')) {
    const e = like(q, 'p.title', 'p.body');
    out.posts = db.prepare(`SELECT p.* FROM posts p WHERE p.status='published' AND (${e.clause}) ORDER BY p.created_at DESC LIMIT 6`)
      .all(...e.params).map((x) => postToApi(x, req.userId));
  }
  if (only('people')) {
    const e = like(q, 'u.name', 'u.username', 'u.course');
    out.people = db.prepare(`SELECT u.id,u.name,u.username,u.avatar,u.course,u.year,u.verified FROM users u WHERE ${visibleUsers(`@PRIV@ AND (${e.clause})`)} ORDER BY u.name LIMIT 6`)
      .all(...e.params);
  }
  if (only('societies')) {
    const e = like(q, 'name', 'description');
    out.societies = db.prepare(`SELECT * FROM societies WHERE (${e.clause}) ORDER BY members DESC LIMIT 6`).all(...e.params);
  }
  if (only('venues')) {
    const e = like(q, 'name', 'description', 'address');
    out.places = db.prepare(`SELECT * FROM places WHERE (${e.clause}) ORDER BY rating DESC LIMIT 6`).all(...e.params);
  }
  if (only('town')) {
    const e = like(q, 'title', 'body');
    out.townUpdates = db.prepare(`SELECT * FROM town_updates WHERE (${e.clause}) ORDER BY created_at DESC LIMIT 4`).all(...e.params);
  }
  if (only('university')) {
    const e = like(q, 'title', 'body');
    out.universityUpdates = db.prepare(`SELECT * FROM university_updates WHERE (${e.clause}) ORDER BY created_at DESC LIMIT 4`).all(...e.params);
  }
  res.json({ q, type, results: out });
});

function empty() {
  return { events: [], posts: [], people: [], societies: [], places: [], townUpdates: [], universityUpdates: [] };
}

// GET /api/search/suggest
r.get('/suggest', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (q.length < 2) return res.json({ suggestions: [] });
  const s = `%${q}%`;
  const rows = [];
  const push = (type, text) => rows.push({ type, text });
  db.prepare('SELECT title FROM events WHERE status=\'published\' AND title LIKE ? ORDER BY start_ms ASC LIMIT 5').all(s)
    .forEach((x) => push('event', x.title));
  db.prepare('SELECT title FROM posts WHERE status=\'published\' AND title LIKE ? LIMIT 4').all(s)
    .forEach((x) => x.title && push('post', x.title));
  db.prepare('SELECT name FROM societies WHERE name LIKE ? LIMIT 4').all(s).forEach((x) => push('society', x.name));
  db.prepare('SELECT name FROM places WHERE name LIKE ? LIMIT 4').all(s).forEach((x) => push('venue', x.name));
  db.prepare(`SELECT username FROM users WHERE (privacy='public') AND username LIKE ? LIMIT 4`).all(s)
    .forEach((x) => push('person', '@' + x.username));
  const chips = ['nightlife', 'music', 'sport', 'food', 'societies', 'university', 'outdoor', 'charity'];
  res.json({ suggestions: rows.slice(0, 12), chips });
});

module.exports = r;
