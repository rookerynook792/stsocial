'use strict';
const { db } = require('../db');
const { CATEGORIES, categoryById, POST_TYPES, postTypeById } = require('../util');
const { publicUser } = require('../auth');

function category(c) {
  const cat = categoryById(c);
  return { id: cat.id, label: cat.label, emoji: cat.emoji, color: cat.color };
}
function postType(t) {
  const pt = postTypeById(t);
  return { id: pt.id, label: pt.label, emoji: pt.emoji };
}

function sourceMeta(row) {
  return {
    type: row.source_type,
    name: row.source_name || null,
    url: row.source_url || null,
    verified: row.source_type === 'university' || row.source_type === 'verified',
    official: row.source_type === 'university',
    community: row.source_type === 'community',
    imported: !!row.source_id,
    reliability: row.reliability || 0,
    sources: safeSources(row.sources),
  };
}
function safeSources(s) {
  try { return s ? JSON.parse(s) : []; } catch { return []; }
}

function myInterest(userId, eventId, type) {
  if (!userId) return false;
  const r = db.prepare('SELECT 1 FROM event_interest WHERE user_id=? AND event_id=? AND type=?').get(userId, eventId, type);
  return !!r;
}

function eventToApi(row, userId) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: category(row.category),
    date: row.date,
    start_time: row.start_time,
    end_time: row.end_time,
    start_ms: row.start_ms,
    location: row.location,
    address: row.address,
    price: row.price,
    ticket_url: row.ticket_url,
    organizer: row.organizer,
    image: row.image,
    emoji: row.emoji,
    featured: !!row.featured,
    status: row.status,
    is_demo: !!row.is_demo,
    created_at: row.created_at,
    interested_count: row.interested_count,
    going_count: row.going_count,
    source: sourceMeta(row),
    my: { interested: myInterest(userId, row.id, 'interested'), going: myInterest(userId, row.id, 'going') },
  };
}

function authorFor(post) {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(post.user_id);
  return publicUser(u);
}
function myVote(userId, postId) {
  if (!userId) return 0;
  const r = db.prepare('SELECT value FROM post_votes WHERE user_id=? AND post_id=?').get(userId, postId);
  return r ? r.value : 0;
}
function commentCount(postId) {
  const r = db.prepare(`SELECT COUNT(*) c FROM comments WHERE post_id=? AND status='published'`).get(postId);
  return r.c;
}
function postToApi(row, userId) {
  if (!row) return null;
  return {
    id: row.id,
    type: postType(row.type),
    title: row.title || '',
    body: row.body,
    event_id: row.event_id,
    is_demo: !!row.is_demo,
    status: row.status,
    created_at: row.created_at,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    score: row.upvotes - row.downvotes,
    comments: commentCount(row.id),
    author: authorFor(row),
    my_vote: myVote(userId, row.id),
    saved: !!userId && !!db.prepare('SELECT 1 FROM post_saves WHERE user_id=? AND post_id=?').get(userId, row.id),
    following: !!userId && !!db.prepare('SELECT 1 FROM post_follows WHERE user_id=? AND post_id=?').get(userId, row.id),
  };
}
function commentToApi(row) {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id);
  return {
    id: row.id, post_id: row.post_id, parent_id: row.parent_id,
    body: row.body, upvotes: row.upvotes, created_at: row.created_at, author: publicUser(u),
  };
}

function page(items, limit, offset) {
  return {
    items,
    total: items.length,
    limit,
    offset,
    nextOffset: offset + items.length < items.length ? offset + items.length : null,
  };
}

module.exports = { eventToApi, postToApi, commentToApi, authorFor, category, postType, sourceMeta, page };
