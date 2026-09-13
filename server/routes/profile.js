'use strict';
const express = require('express');
const { db } = require('../db');
const { eventToApi, postToApi } = require('./common');
const { optionalAuth, getUserByUsername, publicUser } = require('../auth');

const r = express.Router();
r.use(optionalAuth);

function stripForOther(u, isOwner) {
  if (isOwner) return u;
  const copy = { ...u };
  delete copy.email;
  return copy;
}

r.get('/:username', (req, res) => {
  const user = getUserByUsername(req.params.username);
  if (!user) return res.status(404).json({ error: 'Profile not found.' });
  const isOwner = req.userId === user.id;
  const isAdmin = req.user && req.user.role === 'admin';

  if (user.privacy === 'private' && !isOwner && !isAdmin) return res.status(404).json({ error: 'This profile is private.' });
  if (user.privacy === 'students' && !isOwner && !(req.user && req.user.verified)) {
    return res.json({ user: { name: user.name, username: user.username, verified: !!user.verified, avatar: user.avatar }, limited: true, privacy: user.privacy });
  }

  const pub = stripForOther(publicUser(user), isOwner);

  const postCount = db.prepare("SELECT COUNT(*) c FROM posts WHERE user_id=? AND status='published'").get(user.id).c;
  const interestCount = db.prepare('SELECT COUNT(*) c FROM event_interest WHERE user_id=?').get(user.id).c;
  const createdCount = db.prepare("SELECT COUNT(*) c FROM events WHERE creator_id=? AND source_type='community'").get(user.id).c;

  const posts = db.prepare("SELECT * FROM posts WHERE user_id=? AND status='published' ORDER BY created_at DESC LIMIT 12").all(user.id).map((p) => postToApi(p, req.userId));

  const interestedIds = db.prepare("SELECT event_id FROM event_interest WHERE user_id=? AND type='interested'").all(user.id).map((x) => x.event_id);
  const goingIds = db.prepare("SELECT event_id FROM event_interest WHERE user_id=? AND type='going'").all(user.id).map((x) => x.event_id);
  const events = [...new Set([...interestedIds, ...goingIds])].slice(0, 12)
    .map((id) => {
      const row = db.prepare('SELECT * FROM events WHERE id=? AND status!=\'removed\'').get(id);
      return row ? eventToApi(row, req.userId) : null;
    }).filter(Boolean);

  const created = db.prepare("SELECT * FROM events WHERE creator_id=? AND source_type='community' ORDER BY created_at DESC LIMIT 12").all(user.id)
    .map((e) => eventToApi(e, req.userId));

  const savedPosts = isOwner
    ? db.prepare(`SELECT p.* FROM post_saves s JOIN posts p ON p.id=s.post_id WHERE s.user_id=? AND p.status='published' ORDER BY s.created_at DESC LIMIT 20`).all(user.id).map((p) => postToApi(p, req.userId))
    : [];
  const savedEvents = isOwner
    ? interestedIds.slice(0, 20).map((id) => {
      const row = db.prepare('SELECT * FROM events WHERE id=? AND status!=\'removed\'').get(id);
      return row ? eventToApi(row, req.userId) : null;
    }).filter(Boolean)
    : [];

  res.json({
    user: pub,
    isOwner,
    privacy: user.privacy,
    stats: { postCount, interestCount, createdCount, savedPosts: savedPosts.length, savedEvents: savedEvents.length },
    interests: (() => { try { return JSON.parse(user.interests || '[]'); } catch { return []; } })(),
    posts,
    events,
    created,
    savedPosts,
    savedEvents,
  });
});

// POST /api/profiles/:username/follow-ish not needed; keep blocks:
r.post('/:username/block', (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Sign in required.' });
  const target = getUserByUsername(req.params.username);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  if (target.id === req.userId) return res.status(400).json({ error: 'You can\'t block yourself.' });
  db.prepare('INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?,?)').run(req.userId, target.id);
  res.json({ ok: true });
});
r.post('/:username/unblock', (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Sign in required.' });
  const target = getUserByUsername(req.params.username);
  if (target) db.prepare('DELETE FROM blocks WHERE blocker_id=? AND blocked_id=?').run(req.userId, target.id);
  res.json({ ok: true });
});

module.exports = r;
