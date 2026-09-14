'use strict';
const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../auth');
const { TOWN_CATEGORIES } = require('../util');
const config = require('../config');

const r = express.Router();

const PLACE_CATEGORIES = [
  { id: 'bar', label: 'Bars & Nightlife', emoji: '🍺' },
  { id: 'golf', label: 'Golf', emoji: '⛳' },
  { id: 'cafe', label: 'Cafés', emoji: '☕' },
  { id: 'restaurant', label: 'Restaurants', emoji: '🍽️' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎭' },
  { id: 'shop', label: 'Shops', emoji: '🛍️' },
  { id: 'gym', label: 'Gyms', emoji: '💪' },
  { id: 'landmark', label: 'Landmarks & Beaches', emoji: '📍' },
  { id: 'service', label: 'Services', emoji: '🧰' },
];

// GET /api/town/updates
r.get('/updates', (req, res) => {
  const { category, limit = 30 } = req.query;
  const where = category && category !== 'all' ? 'WHERE category = ?' : '';
  const params = category && category !== 'all' ? [category] : [];
  const rows = db.prepare(`SELECT * FROM town_updates ${where} ORDER BY created_at DESC LIMIT ?`).all(...params, Number(limit));
  res.json({
    updates: rows.map((u) => ({
      id: u.id, category: u.category, title: u.title, body: u.body,
      source_name: u.source_name, verified: !!u.verified, is_demo: config.demoMode, created_at: u.created_at,
    })),
    categories: TOWN_CATEGORIES,
  });
});

// GET /api/town/places
r.get('/places', (req, res) => {
  const { category, q } = req.query;
  const where = []; const params = [];
  if (category && category !== 'all') { where.push('category = ?'); params.push(category); }
  if (q) { where.push('(name LIKE ? OR description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const rows = db.prepare(`SELECT * FROM places ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY rating DESC LIMIT 100`).all(...params);
  res.json({
    places: rows.map((p) => ({
      id: p.id, name: p.name, category: p.category, address: p.address, hours: p.hours,
      website: p.website, description: p.description, rating: p.rating, review_count: p.review_count,
      emoji: p.emoji, image: p.image, lat: p.lat, lng: p.lng, is_demo: !!p.is_demo,
      price: p.price, vibe: p.vibe, must_try: p.must_try, student_tip: p.student_tip, fun_fact: p.fun_fact,
    })),
    categories: PLACE_CATEGORIES,
  });
});

// GET /api/town/places/:id
r.get('/places/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM places WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Place not found.' });
  const reviews = db.prepare('SELECT cr.*, (SELECT name FROM users WHERE id = cr.user_id) AS author_name FROM place_reviews cr WHERE cr.place_id = ? ORDER BY created_at DESC LIMIT 50').all(p.id);
  res.json({
    place: {
      id: p.id, name: p.name, category: p.category, address: p.address, hours: p.hours, website: p.website,
      description: p.description, rating: p.rating, review_count: p.review_count, emoji: p.emoji, image: p.image,
      lat: p.lat, lng: p.lng, price: p.price, vibe: p.vibe, must_try: p.must_try, student_tip: p.student_tip, fun_fact: p.fun_fact,
    },
    reviews: reviews.map((x) => ({ id: x.id, rating: x.rating, body: x.body, author_name: x.author_name, created_at: x.created_at })),
  });
});

// POST /api/town/places/:id/reviews
r.post('/places/:id/reviews', requireAuth, (req, res) => {
  const p = db.prepare('SELECT * FROM places WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Place not found.' });
  const rating = Math.max(1, Math.min(5, Number(req.body && req.body.rating) || 0));
  if (!rating) return res.status(400).json({ error: 'Please add a star rating.' });
  const body = (req.body && req.body.body) || '';
  db.prepare('INSERT INTO place_reviews (place_id, user_id, rating, body, created_at) VALUES (?,?,?,?,?)')
    .run(p.id, req.userId, rating, body, Date.now());
  const agg = db.prepare('SELECT AVG(rating) a, COUNT(*) c FROM place_reviews WHERE place_id=?').get(p.id);
  db.prepare('UPDATE places SET rating=?, review_count=review_count+1 WHERE id=?').run(Math.round(agg.a * 10) / 10, p.id);
  res.status(201).json({ ok: true, rating: Math.round(agg.a * 10) / 10 });
});

module.exports = r;
