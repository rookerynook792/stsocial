'use strict';
const express = require('express');
const { db } = require('../db');
const { eventToApi, postToApi } = require('./common');
const { startOfDay, toMs } = require('../util');
const { lastIngest } = require('../aggregation/pipeline');
const config = require('../config');

const r = express.Router();
const H = 3600000, DAY = 86400000;

function endMs(ev) {
  if (ev.end_time) return toMs(ev.date, ev.end_time);
  return ev.start_ms + 3 * H;
}

r.get('/', (req, res) => {
  const now = Date.now();
  const t0 = startOfDay(now);
  const uid = req.userId;
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = req.user ? req.user.name.split(' ')[0] : 'there';

  const dayRows = db.prepare(`
    SELECT * FROM events WHERE status='published' AND approved=1
    AND start_ms >= ? AND start_ms <= ?
  `).all(t0 - 3 * H, t0 + DAY + 6 * H);

  const happeningToday = dayRows.filter((e) => e.start_ms >= t0 && e.start_ms < t0 + DAY)
    .sort((a, b) => a.start_ms - b.start_ms);
  const happeningNow = dayRows.filter((e) => e.start_ms <= now && endMs(e) >= now)
    .sort((a, b) => a.start_ms - b.start_ms);

  const comingUp = db.prepare(`
    SELECT * FROM events WHERE status='published' AND approved=1
    AND start_ms >= ? AND start_ms <= ?
    ORDER BY (interested_count + going_count) DESC, start_ms ASC LIMIT 8
  `).all(t0 + DAY, t0 + 5 * DAY);

  const tonight = dayRows.filter((e) => endMs(e) >= t0 + 17 * H)
    .sort((a, b) => b.interested_count - a.interested_count);

  const town = db.prepare('SELECT * FROM town_updates ORDER BY created_at DESC LIMIT 5').all();
  const uni = db.prepare('SELECT * FROM university_updates ORDER BY important DESC, created_at DESC LIMIT 5').all();
  const forumLatest = db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id AND c.status='published') cc
    FROM posts p WHERE p.status='published' ORDER BY p.created_at DESC LIMIT 6
  `).all();
  const trending = db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id AND c.status='published') cc
    FROM posts p WHERE p.status='published'
    ORDER BY (p.upvotes - p.downvotes) + MIN(cc,30) DESC, p.created_at DESC LIMIT 4
  `).all();

  const activeStudents = db.prepare('SELECT COUNT(*) c FROM users WHERE status=?').get('active').c;
  const posts24h = db.prepare('SELECT COUNT(*) c FROM posts WHERE created_at > ?').get(now - DAY).c;
  const ing = lastIngest();

  res.json({
    greeting: `${greeting}, ${firstName}`,
    question: "What's happening in St Andrews right now?",
    now: {
      date: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
      is_demo: config.demoMode,
    },
    demoMode: config.demoMode,
    happeningNow: happeningNow.map((e) => eventToApi(e, uid)),
    happeningToday: happeningToday.map((e) => eventToApi(e, uid)),
    comingUp: comingUp.map((e) => eventToApi(e, uid)),
    trendingTonight: tonight.slice(0, 4).map((e) => eventToApi(e, uid)),
    townUpdates: town.map((u) => ({ id: u.id, category: u.category, title: u.title, body: u.body, verified: !!u.verified, created_at: u.created_at })),
    universityUpdates: uni.map((u) => ({ id: u.id, category: u.category, title: u.title, body: u.body, important: !!u.important, created_at: u.created_at })),
    forumActivity: forumLatest.map((p) => postToApi(p, uid)),
    trendingForum: trending.map((p) => postToApi(p, uid)),
    stats: { activeStudents, posts24h, eventsToday: happeningToday.length },
    quickActions: [
      { id: 'find_events', label: 'Find Events', emoji: '📅', link: '#/events' },
      { id: 'post_forum', label: 'Post to Forum', emoji: '💬', link: '#/compose/post' },
      { id: 'announce', label: 'Announce an Event', emoji: '📣', link: '#/compose/event' },
      { id: 'town', label: 'Town Updates', emoji: '🏘️', link: '#/town' },
    ],
    lastIngest: ing ? { at: ing.at, agoMs: ing.agoMs } : null,
  });
});

module.exports = r;
