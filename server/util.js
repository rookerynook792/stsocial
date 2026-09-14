'use strict';
const crypto = require('crypto');

/* ---------------------------------- crypto --------------------------------- */

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64);
  return { salt, hash: derived.toString('hex') };
}
function verifyPassword(password, salt, hash) {
  const derived = crypto.scryptSync(String(password), salt, 64);
  const a = Buffer.from(hash, 'hex');
  const b = derived;
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function newToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}
function sha1(str) {
  return crypto.createHash('sha1').update(String(str)).digest('hex');
}

/* --------------------------------- datetime -------------------------------- */

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function endOfDay(ts) {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
function daysFromNow(n) {
  return startOfDay(Date.now()) + n * DAY;
}
function toMs(dateStr, timeStr) {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM
  if (!dateStr) return Date.now();
  const [y, m, d] = String(dateStr).split('-').map(Number);
  let hh = 0, mm = 0;
  if (timeStr) {
    const parts = String(timeStr).split(':').map(Number);
    hh = parts[0] || 0;
    mm = parts[1] || 0;
  }
  return new Date(y, (m || 1) - 1, d || 1, hh, mm).getTime();
}
function fmtDate(ms) {
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function fmtTime(ms) {
  return new Date(ms).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
}
function relTime(ms) {
  const diff = Date.now() - ms;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function relTimeShort(ms) {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.round(hr / 24)}d`;
}

/* ---------------------------------- misc ----------------------------------- */

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item';
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* -------------------------------- categories ------------------------------- */

const CATEGORIES = [
  { id: 'nightlife', label: 'Nightlife', emoji: '🎉', color: '#7C3AED' },
  { id: 'music', label: 'Music', emoji: '🎵', color: '#DB2777' },
  { id: 'sport', label: 'Sport', emoji: '🏉', color: '#16A34A' },
  { id: 'arts', label: 'Arts & Culture', emoji: '🎭', color: '#EA580C' },
  { id: 'university', label: 'University', emoji: '🎓', color: '#4F46E5' },
  { id: 'food', label: 'Food & Drink', emoji: '🍔', color: '#D97706' },
  { id: 'societies', label: 'Societies', emoji: '🧑‍🤝‍🧑', color: '#0EA5E9' },
  { id: 'academic', label: 'Academic', emoji: '📚', color: '#0D9488' },
  { id: 'careers', label: 'Careers', emoji: '💼', color: '#334155' },
  { id: 'outdoor', label: 'Outdoor', emoji: '🏖️', color: '#0891B2' },
  { id: 'charity', label: 'Charity', emoji: '❤️', color: '#E11D48' },
  { id: 'other', label: 'Other', emoji: '📅', color: '#64748B' },
];
function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

const POST_TYPES = [
  { id: 'discussion', label: 'Discussion', emoji: '💬' },
  { id: 'question', label: 'Question', emoji: '❓' },
  { id: 'event', label: 'Event', emoji: '📅' },
  { id: 'announcement', label: 'Announcement', emoji: '📣' },
  { id: 'recommendation', label: 'Recommendation', emoji: '⭐' },
  { id: 'lostfound', label: 'Lost & Found', emoji: '🔎' },
  { id: 'accommodation', label: 'Accommodation', emoji: '🏠' },
  { id: 'buysell', label: 'Buy & Sell', emoji: '🛒' },
  { id: 'society', label: 'Society', emoji: '🧑‍🤝‍🧑' },
  { id: 'marketplace', label: 'Marketplace', emoji: '🏪' },
  { id: 'other', label: 'Other', emoji: '📌' },
];
function postTypeById(id) {
  return POST_TYPES.find((t) => t.id === id) || POST_TYPES[POST_TYPES.length - 1];
}

const TOWN_CATEGORIES = [
  { id: 'road', label: 'Road Closures', emoji: '🚧' },
  { id: 'transport', label: 'Transport & Buses', emoji: '🚌' },
  { id: 'weather', label: 'Weather', emoji: '⛅' },
  { id: 'business', label: 'Local Business', emoji: '🏪' },
  { id: 'council', label: 'Council', emoji: '🏛️' },
  { id: 'community', label: 'Community', emoji: '🧑‍🤝‍🧑' },
  { id: 'student', label: 'Student Info', emoji: '🎓' },
  { id: 'news', label: 'Local News', emoji: '📰' },
  { id: 'golf', label: 'Golf', emoji: '⛳' },
];

const UNI_CATEGORIES = [
  { id: 'news', label: 'University News', emoji: '📰' },
  { id: 'academic', label: 'Academic', emoji: '📚' },
  { id: 'exams', label: 'Exams', emoji: '📝' },
  { id: 'accommodation', label: 'Accommodation', emoji: '🏠' },
  { id: 'student_services', label: 'Student Services', emoji: '🤝' },
  { id: 'careers', label: 'Careers', emoji: '💼' },
  { id: 'societies', label: 'Societies', emoji: '🧑‍🤝‍🧑' },
  { id: 'sports', label: 'Sports', emoji: '🏉' },
  { id: 'notices', label: 'Important Notices', emoji: '🚨' },
];

module.exports = {
  hashPassword, verifyPassword, newToken, sha1,
  startOfDay, endOfDay, daysFromNow, toMs, fmtDate, fmtTime, relTime, relTimeShort,
  clamp, escapeHtml, slug, pick, randInt,
  CATEGORIES, categoryById, POST_TYPES, postTypeById, TOWN_CATEGORIES, UNI_CATEGORIES,
};
