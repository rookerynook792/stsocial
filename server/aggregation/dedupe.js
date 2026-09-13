'use strict';
/**
 * Duplicate detection & merging.
 *
 * When the same event appears in multiple sources we want ONE event that
 * carries every source, keeps the most reliable one as the "primary", and
 * merges in the richest description.
 */
const { sha1 } = require('../util');

const STOPWORDS = new Set([
  'a', 'an', 'the', 'in', 'at', 'on', 'for', 'of', 'to', 'and', 'or', 'with',
  'your', 'our', 'their', 'his', 'her', 'its', 'you', 'we', 'they', 'is', 'are',
  'be', 'will', 'this', 'that', 'these', 'those', 'from', 'by', 'up', 'down',
  'new', 'st', 'andrews', 'town', 'centre', 'center', 'tonight', 'today', 'tonights',
]);

function significantWords(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/**
 * Primary dedup key: normalised significant words (first 5, sorted) + date.
 * Insensitive to word order, punctuation and case differences between sources.
 */
function makeKey(title, date) {
  const words = significantWords(title).slice(0, 5).sort().join('_');
  return sha1(`${words}::${(date || '').slice(0, 10)}`);
}

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size && !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

/**
 * Looser match: same date and at least ~60% shared significant words.
 * Catches reworded titles that the exact key misses.
 */
function fuzzyMatches(existing, incoming) {
  if (existing.date && incoming.date && existing.date !== incoming.date) return false;
  const a = significantWords(existing.title);
  const b = significantWords(incoming.title);
  if (!a.length || !b.length) return false;
  return jaccard(a, b) >= 0.6;
}

module.exports = { makeKey, significantWords, fuzzyMatches, jaccard };
