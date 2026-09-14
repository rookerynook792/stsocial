'use strict';
/**
 * Rule-based event categoriser.
 * Maps free-text titles/descriptions onto SAINT SOCIAL's 12 categories using
 * keyword weights. A provider may also supply an explicit category, which wins.
 */

const RULES = [
  { id: 'nightlife', k: ['night', 'club', 'club night', 'rave', 'party', 'bar', 'cocktail', 'kebab night', 'sake', 'lounge', 'clubbing', 'afterparty', 'drinks', 'bar crawl', 'bottle', 'dj', 'dance'] },
  { id: 'music', k: ['gig', 'concert', 'band', 'live music', 'folk', 'ceilidh', 'choir', 'orchestra', 'open mic', 'acoustic', 'symphony', 'festival', 'tribute', 'singer', 'vocal', 'reggae', 'rock', 'pop', 'indie', 'session', 'concert'] },
  { id: 'sport', k: ['rugby', 'football', 'soccer', 'netball', 'basketball', 'tennis', 'golf', 'swim', 'rowing', 'crew', 'regatta', 'cricket', 'badminton', 'fitness', 'yoga', 'hiit', 'boxing', 'judo', 'martial arts', 'sports', 'match', 'fixture', 'gym', 'athletics', 'cross country', 'volleyball', 'squash'] },
  { id: 'arts', k: ['exhibit', 'exhibition', 'gallery', 'theatre', 'theater', 'play', 'film', 'cinema', 'movie', 'art', 'museum', 'poetry', 'drama', 'opera', 'jazz', 'show', 'painting', 'sculpture', 'festival', 'performance', 'book launch'] },
  { id: 'university', k: ['university', 'matriculation', 'orientation', 'fresher', 'freshers', 'faculty', 'department', 'registrar', 'graduation', 'convocation', 'induction', 'student union', 'students association', 'sac', 'society fair', 'university hall'] },
  { id: 'food', k: ['restaurant', 'cafe', 'coffee', 'brunch', 'dinner', 'lunch', 'tasting', 'food', 'eat', 'bake', 'baking', 'market', 'farmers', 'cheese', 'wine', 'beer', 'brew', 'pub', 'kitchen', 'supper', 'breakfast', 'taco', 'pizza', 'burr'] },
  { id: 'societies', k: ['society', 'societies', 'club society', 'open evening', 'society meet', 'debate', 'chess', 'film society', 'reading', 'language', 'politics', 'business society', 'investment', 'photography', 'theatre society', 'dancing', 'dance society', 'robotics', 'coding', 'gaming'] },
  { id: 'academic', k: ['lecture', 'workshop', 'seminar', 'study', 'reading group', 'writing', 'conference', 'talk', 'symposium', 'webinar', 'research', 'academic', 'tutorial', 'skill', 'how to', '1:1', 'office hours'] },
  { id: 'careers', k: ['career', 'recruitment', 'recruit', 'intern', 'internship', 'job', 'jobs', 'employ', 'employer', 'networking', 'cv', 'cv clinic', 'linkedin', 'graduate', 'placement', 'recruiters', 'industry'] },
  { id: 'outdoor', k: ['beach', 'hike', 'hiking', 'climb', 'climbing', 'trail', 'walk', 'walks', 'kayak', 'kayaking', 'cycle', 'cycling', 'yoga on', 'beach walk', 'sunrise', 'sunset', 'camping', 'coast', 'saltcoats', 'crail', 'kinnaird'] },
  { id: 'charity', k: ['charity', 'fundraiser', 'fundraising', 'donate', 'volunteer', 'food bank', 'charity run', 'awareness', 'galadinner', 'benefit'] },
];

function categorize(title, description, explicit) {
  if (explicit) return explicit;
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  const scores = {};
  for (const rule of RULES) {
    let s = 0;
    for (const kw of rule.k) {
      if (text.includes(kw)) s += kw.includes(' ') ? 2 : 1;
    }
    scores[rule.id] = s;
  }
  let best = 'other';
  let bestScore = 0;
  for (const [id, s] of Object.entries(scores)) {
    if (s > bestScore) { bestScore = s; best = id; }
  }
  return best;
}

module.exports = { categorize };
