'use strict';
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('./config');

fs.mkdirSync(config.dataDir, { recursive: true });

const db = new Database(config.dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrate() {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    avatar TEXT,            -- emoji or colour key
    course TEXT,
    year TEXT,
    bio TEXT,
    interests TEXT,         -- JSON array
    role TEXT NOT NULL DEFAULT 'student',   -- student | admin
    verified INTEGER NOT NULL DEFAULT 0,    -- University of St Andrews student
    privacy TEXT NOT NULL DEFAULT 'public', -- public | students | private
    status TEXT NOT NULL DEFAULT 'active',  -- active | suspended | banned
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS event_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,            -- university | students_assoc | venue | rss | manual
    url TEXT,
    reliability INTEGER NOT NULL DEFAULT 5,   -- 1..10 (higher = more trusted)
    config TEXT,                   -- JSON
    enabled INTEGER NOT NULL DEFAULT 1,
    last_run INTEGER,
    last_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    date TEXT,                      -- YYYY-MM-DD
    start_time TEXT,                -- HH:MM
    end_time TEXT,
    start_ms INTEGER,               -- for fast date filtering
    location TEXT,
    address TEXT,
    lat REAL,
    lng REAL,
    price TEXT,                     -- free | numeric string
    ticket_url TEXT,
    organizer TEXT,
    creator_id INTEGER,
    image TEXT,                     -- css gradient key or url
    emoji TEXT,
    reliability INTEGER NOT NULL DEFAULT 5,
    source_type TEXT NOT NULL DEFAULT 'community', -- university | verified | imported | community
    source_id INTEGER,
    source_name TEXT,
    source_url TEXT,
    dedup_key TEXT,
    sources TEXT,                   -- JSON list of {name,url} merged for this event
    interested_count INTEGER NOT NULL DEFAULT 0,
    going_count INTEGER NOT NULL DEFAULT 0,
    featured INTEGER NOT NULL DEFAULT 0,
    approved INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'published', -- published | pending | rejected | removed
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_ms);
  CREATE INDEX IF NOT EXISTS idx_events_cat ON events(category);
  CREATE INDEX IF NOT EXISTS idx_events_dedup ON events(dedup_key);

  CREATE TABLE IF NOT EXISTS event_interest (
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    type TEXT NOT NULL,             -- interested | going
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, event_id, type)
  );
  CREATE TABLE IF NOT EXISTS event_views (
    event_id INTEGER NOT NULL,
    user_id INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'discussion',
    title TEXT,
    body TEXT NOT NULL,
    event_id INTEGER,
    created_at INTEGER NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    saved INTEGER NOT NULL DEFAULT 0,
    reported INTEGER NOT NULL DEFAULT 0,
    approved INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'published', -- published | pending | removed
    is_demo INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);

  CREATE TABLE IF NOT EXISTS post_votes (
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    value INTEGER NOT NULL,         -- 1 | -1
    PRIMARY KEY (user_id, post_id)
  );
  CREATE TABLE IF NOT EXISTS post_saves (
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, post_id)
  );
  CREATE TABLE IF NOT EXISTS post_follows (
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, post_id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    reported INTEGER NOT NULL DEFAULT 0,
    approved INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'published'
  );
  CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
  CREATE TABLE IF NOT EXISTS comment_votes (
    user_id INTEGER NOT NULL,
    comment_id INTEGER NOT NULL,
    value INTEGER NOT NULL,
    PRIMARY KEY (user_id, comment_id)
  );

  CREATE TABLE IF NOT EXISTS town_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    source_name TEXT,
    source_url TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    dedup_key TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS university_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    source_name TEXT,
    source_url TEXT,
    important INTEGER NOT NULL DEFAULT 0,
    dedup_key TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,         -- cafe | restaurant | bar | shop | gym | entertainment | service
    address TEXT,
    hours TEXT,
    website TEXT,
    description TEXT,
    rating REAL NOT NULL DEFAULT 0,
    review_count INTEGER NOT NULL DEFAULT 0,
    emoji TEXT,
    image TEXT,
    lat REAL,
    lng REAL,
    is_demo INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS place_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id INTEGER NOT NULL,
    user_id INTEGER,
    rating INTEGER NOT NULL,
    body TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    body TEXT,
    link TEXT,
    created_at INTEGER NOT NULL,
    read INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);

  CREATE TABLE IF NOT EXISTS notifications_prefs (
    user_id INTEGER PRIMARY KEY,
    prefs TEXT NOT NULL DEFAULT '{}'   -- JSON of toggles
  );

  CREATE TABLE IF NOT EXISTS societies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emoji TEXT,
    category TEXT,
    description TEXT,
    members INTEGER NOT NULL DEFAULT 0,
    is_demo INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL,        -- event | post | comment | user
    target_id INTEGER NOT NULL,
    reporter_id INTEGER,
    reason TEXT,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | resolved | dismissed
    created_at INTEGER NOT NULL,
    resolved_at INTEGER,
    resolved_by INTEGER
  );

  CREATE TABLE IF NOT EXISTS blocks (
    blocker_id INTEGER NOT NULL,
    blocked_id INTEGER NOT NULL,
    PRIMARY KEY (blocker_id, blocked_id)
  );

  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  `);
}

function metaGet(key, def) {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return row ? row.value : def;
}
function metaSet(key, value) {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value);
}

migrate();

// Lightweight migrations for databases created before a column was added.
(function migrateAdditions() {
  const cols = db.prepare('PRAGMA table_info(events)').all().map((c) => c.name);
  if (!cols.includes('updated_at')) db.exec('ALTER TABLE events ADD COLUMN updated_at INTEGER');
  if (!cols.includes('creator_id')) db.exec('ALTER TABLE events ADD COLUMN creator_id INTEGER');
  if (!cols.includes('reliability')) db.exec('ALTER TABLE events ADD COLUMN reliability INTEGER NOT NULL DEFAULT 5');
})();

module.exports = { db, metaGet, metaSet };
