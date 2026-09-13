'use strict';
const express = require('express');
const { db } = require('../db');
const { UNI_CATEGORIES } = require('../util');

const r = express.Router();

// GET /api/university/updates
r.get('/updates', (req, res) => {
  const { category, limit = 40 } = req.query;
  const where = category && category !== 'all' ? 'WHERE category = ?' : '';
  const params = category && category !== 'all' ? [category] : [];
  const rows = db.prepare(`SELECT * FROM university_updates ${where} ORDER BY important DESC, created_at DESC LIMIT ?`).all(...params, Number(limit));
  res.json({
    updates: rows.map((u) => ({
      id: u.id, category: u.category, title: u.title, body: u.body,
      source_name: u.source_name, important: !!u.important, created_at: u.created_at,
    })),
    categories: UNI_CATEGORIES,
  });
});

module.exports = r;
