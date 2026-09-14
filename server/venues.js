'use strict';
/**
 * Real local St Andrews venues & places — bars, cafes, restaurants,
 * entertainment, shops, the golf courses, and the town's landmarks.
 *
 * These are REAL places with real locations (not sample data), seeded once so
 * the Town page, map and search have a genuine "where to go / what's here"
 * list. Student reviews start at 0 and are added by real users.
 */

const VENUES = [
  /* ------------------------------ bars / nightlife ------------------------------ */
  { name: 'The SA — Students’ Association', category: 'bar', address: '47 High Street, St Andrews', emoji: '🎓',
    description: 'Home of student nightlife — society nights, live music, DJs and the famous kebab night. The beating heart of student social life.',
    website: 'https://www.yourunion.net', lat: 56.3360, lng: -2.8020 },
  { name: 'The Vic', category: 'bar', address: '1 Saint Marys Place, St Andrews KY16 9UY', emoji: '🍺',
    description: 'St Andrews’ most famous student pub — live music, cheap and cheerful meals, and a bar that stays busy till late. Hosts the town’s Hogmanay party.',
    website: 'https://vicstandrews.co.uk', lat: 56.3402, lng: -2.7990 },
  { name: 'The Keys Bar', category: 'bar', address: '87 Market Street, St Andrews KY16 9NX', emoji: '🥃',
    description: 'Traditional pub with an excellent whisky selection and very friendly staff — a favourite for a quiet pint on Market Street.' },
  { name: 'Whey Pat Tavern', category: 'bar', address: '1 Bridge Street, St Andrews KY16 9EX', emoji: '📺',
    description: 'Local sports bar — big screens on all the matches, beer, and a solid traditional pub menu.' },
  { name: 'Molly Malones', category: 'bar', address: '5 Alexandra Place, St Andrews KY16 9XD', emoji: '🍀',
    description: 'Irish pub on Alexandra Place serving cocktails, live music and pub classics.' },
  { name: 'Aikman’s Bar & Bistro', category: 'bar', address: '32 Bell Street, St Andrews KY16 9UX', emoji: '🎶',
    description: 'Bar-bistro near the pier with a stage for regular live music — a well-known spot for a night out.' },
  { name: 'One Under Bar', category: 'bar', address: 'Rusacks, Pilmour Links, St Andrews KY16 9JQ', emoji: '⛳',
    description: 'Golf-themed bar on the Pilmour links — sport, beer and links views, minutes from the courses.' },

  /* ---------------------------------- cafes ---------------------------------- */
  { name: 'The Elephant House', category: 'cafe', address: '63 High Street, St Andrews', emoji: '☕',
    description: 'St Andrews’ famous coffeehouse and bookshop — a favourite for students and visitors, right in the old town.' },
  { name: 'The Jigger Inn', category: 'cafe', address: 'West Road, by the Old Course, St Andrews', emoji: '🥐',
    description: 'Relaxed inn and café a short walk from the Old Course — breakfasts, lunch and a cosy bar.' },

  /* ------------------------------- restaurants ------------------------------- */
  { name: 'The Fife Arms', category: 'restaurant', address: '13 Bell Street, St Andrews', emoji: '🍽️',
    description: 'Elegant town-hotel restaurant, a St Andrews institution since 1820 — fine dining in the heart of the old town.' },
  { name: 'Fairmont St Andrews', category: 'restaurant', address: '290 West Road, St Andrews', emoji: '🍷',
    description: 'Luxury seaside hotel with fine dining and floor-to-ceiling views over the Old Course and the sea.' },

  /* ------------------------------ entertainment ------------------------------ */
  { name: 'The Byre Theatre', category: 'entertainment', address: 'West Street, St Andrews', emoji: '🎭',
    description: 'The university’s historic theatre — drama, dance, comedy and music on a stage that has hosted the great and the geeky.' },
  { name: 'St Andrews Sailing Club', category: 'entertainment', address: 'East Shore, St Andrews', emoji: '⛵',
    description: 'The town’s home of sailing — regattas, club races and the annual coastal regatta on the Bay.' },

  /* ---------------------------------- shops ---------------------------------- */
  { name: 'Main Street & High Street', category: 'shop', address: 'Main Street / High Street, St Andrews', emoji: '🛍️',
    description: 'The town’s main shopping streets — independent boutiques, bookshops, ice-cream and the famous golf stores.' },

  /* ---------------------------------- gym ------------------------------------ */
  { name: 'The SA — Students’ Gym', category: 'gym', address: '47 High Street, St Andrews', emoji: '💪',
    description: 'The students’ gym in the SA building — weights, cardio and group classes for students and locals.' },

  /* ---------------------------------- golf ----------------------------------- */
  { name: 'The Old Course', category: 'golf', address: 'The Links, St Andrews', emoji: '⛳',
    description: 'The “Home of Golf” — one of the world’s most famous courses, played since the 1500s and home to The Open. Open to the public.',
    website: 'https://www.st-andrewslinks.com', lat: 56.3394, lng: -2.8013 },
  { name: 'Swilcan Bridge', category: 'golf', address: '17th green, The Old Course, St Andrews', emoji: '🌉',
    description: 'The most photographed bridge in golf — crossing Swilcan Burn by the Old Course 17th green.', lat: 56.3385, lng: -2.8000 },
  { name: 'The R&A — Home of Golf Museum', category: 'golf', address: 'Marsh Road, St Andrews', emoji: '🏆',
    description: 'Headquarters of golf’s governing body and a world-class museum of the game’s history, by the Old Course.',
    website: 'https://www.ra.com', lat: 56.3390, lng: -2.8040 },
  { name: 'The New Course', category: 'golf', address: 'West Road, St Andrews', emoji: '⛳',
    description: 'One of the Links Trust courses — a rugged, links test just north of the town.' },

  /* ------------------------------- landmarks ---------------------------------- */
  { name: 'St Andrews Castle', category: 'landmark', address: 'Castle Rock, West Sands, St Andrews', emoji: '🏰',
    description: 'A dramatic 15th-century castle on Castle Rock — the town’s first fortification, right on the beach.', lat: 56.3378, lng: -2.8050 },
  { name: 'St Salvator’s Church', category: 'landmark', address: 'High Street, St Andrews', emoji: '⛪',
    description: 'The “Bells of St Salvator” — the university’s church, rung for matriculation, graduations and Hogmanay.', lat: 56.3363, lng: -2.8025 },
  { name: 'The Quad', category: 'landmark', address: 'High Street, St Andrews', emoji: '🌳',
    description: 'The university’s green quadrangle at the heart of the old town — a classic St Andrews picture.', lat: 56.3368, lng: -2.8005 },
  { name: 'West Sands', category: 'landmark', address: 'West Sands, St Andrews', emoji: '🏖️',
    description: 'The famous sandy beach by the castle and the Old Course — calm water and wide sands.', lat: 56.3310, lng: -2.8120 },
  { name: 'Saltcoats Beach', category: 'landmark', address: 'Saltcoats, St Andrews', emoji: '🏖️',
    description: 'The town’s main beach — sunbathing, water sports and the long walk to the west shore.', lat: 56.3300, lng: -2.8100 },
  { name: 'Tay Park', category: 'landmark', address: 'Tay Park, St Andrews', emoji: '🌲',
    description: 'The town’s big park — sports pitches, playgrounds, a bandstand and a splash of green on the east side.', lat: 56.3350, lng: -2.7950 },
  { name: 'Kinnaird Head', category: 'landmark', address: 'Kinnaird Head, St Andrews', emoji: '🌊',
    description: 'A dramatic cliff walk and nature reserve north of the town — seabirds, seals and wide views.', lat: 56.3300, lng: -2.8160 },
  { name: 'The Pier', category: 'landmark', address: 'West Shore, St Andrews', emoji: '⚓',
    description: 'The old fishing pier on the west shore — the spot for the traditional student Pier Walk.', lat: 56.3345, lng: -2.8035 },
];

function seedVenues() {
  const { db } = require('./db');
  const exists = db.prepare('SELECT id FROM places WHERE name = ?');
  const ins = db.prepare(`
    INSERT INTO places (name, category, address, hours, website, description, rating, review_count, emoji, image, lat, lng, is_demo)
    VALUES (?, ?, ?, NULL, ?, ?, 0, 0, ?, NULL, ?, ?, 0)
  `);
  let added = 0;
  for (const v of VENUES) {
    if (exists.get(v.name)) continue;
    ins.run(v.name, v.category, v.address, v.website || null, v.description, v.emoji, v.lat ?? null, v.lng ?? null);
    added++;
  }
  if (added) console.log(`[venues] added ${added} real local venues`);
}

module.exports = { seedVenues, VENUES };
