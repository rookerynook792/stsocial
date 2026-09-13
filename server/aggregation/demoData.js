'use strict';
/**
 * DEMO DATA ONLY.
 *
 * Nothing here is a real event. These are realistic *samples* used so the app
 * is fully explorable before live sources are connected. Every item is stored
 * with is_demo=1 and surfaced behind a "DEMO DATA" banner.
 *
 * Dates are generated relative to "now" so Today / Tonight / This Weekend /
 * Next Week all have content on any day you open the app.
 */
const { CATEGORIES } = require('../util');

function iso(offsetDays, time) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  d.setHours(0, 0, 0, 0);
  const date = d.toISOString().slice(0, 10);
  return { date, time };
}
const cat = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

// [offsetDays, startTime, endTime, category, title, location, desc, extra]
const SEEDS = [
  [0, '19:00', '23:30', 'nightlife', "Fresher's Social — The SA Lounge", 'Town centre',
    'Kick off the week with music, drinks and games with the Students\' Association.', { emoji: '🎉', image: 'night', price: 'Free', organizer: 'Students\' Association (sample)', rel: 8 }],
  [0, '18:00', '21:00', 'music', 'Folk Session at the Castle Rock Tavern', 'Castle Street',
    'An informal evening of trad tunes. Drop in and bring an instrument if you have one.', { emoji: '🎵', image: 'ember', price: 'Free', organizer: 'Community (sample)', rel: 5 }],
  [0, '12:30', '15:30', 'sport', 'Open Training — Men\'s & Women\'s Rugby', 'Sports Ground',
    'St Andrews RFC open training. All abilities welcome, kit provided.', { emoji: '🏉', image: 'grass', price: 'Free', organizer: 'St Andrews RFC (sample)', rel: 7 }],
  [0, '17:30', '19:00', 'food', "Burr O'Reilly's Evening Tasting Menu", 'North Street',
    'A three-course local tasting menu with a cheese pairing.', { emoji: '🍽️', image: 'gold', price: '£42', organizer: 'Burr O\'Reilly\'s (sample)', rel: 6 }],
  [0, '20:00', '23:00', 'nightlife', 'Late Kebab Run + Cinema Night', 'The Square',
    'The classic: a quick dinner out then a late show. Meet at 8.', { emoji: '🍢', image: 'plum', price: '≈£15', organizer: 'Community (sample)', rel: 4 }],
  [0, '16:00', '18:00', 'outdoor', 'Sunset Beach Walk with the Photography Society', 'South Beach',
    'A relaxed coastal walk and a golden-hour photo session. Cameras welcome.', { emoji: '📷', image: 'ocean', price: 'Free', organizer: 'Photography Society (sample)', rel: 6 }],
  [1, '18:30', '22:00', 'nightlife', 'Sake & Social — Japanese Culture Evening', 'The SA',
    'Drinks, food and a bit of culture with the Japanese Society.', { emoji: '🍶', image: 'night', price: '£5', organizer: 'Japanese Society (sample)', rel: 6 }],
  [1, '19:00', '22:30', 'arts', 'Open Mic Night', 'Town hall hall',
    'Comedians, singers, poets and the slightly overconfident. 5-minute slots.', { emoji: '🎤', image: 'ember', price: 'Free', organizer: 'Open Mic Collective (sample)', rel: 5 }],
  [1, '14:00', '16:00', 'academic', 'Study Skills Workshop: Referencing Without Tears', 'Main Library',
    'Practical tips on referencing, essays and time management from the library team.', { emoji: '📚', image: 'sky', price: 'Free', organizer: 'University Library (sample)', rel: 9 }],
  [1, '17:00', '19:30', 'food', 'Farmers\' Market & Street Food', 'Tay Park',
    'Local produce, street food stalls and live acoustic sets in the park.', { emoji: '🥕', image: 'grass', price: 'Pay per item', organizer: 'Community (sample)', rel: 5 }],
  [1, '20:00', '23:00', 'music', 'Reggae & Roots Night', 'The Castle Rock Tavern',
    'A laid-back evening of roots reggae and dub.', { emoji: '🎶', image: 'plum', price: '£8', organizer: 'Community (sample)', rel: 5 }],
  [2, '19:00', '23:00', 'nightlife', 'Big Night Out: Club 21 (18+)', 'The SA',
    'The week\'s biggest student club night. 18+ with student ID.', { emoji: '🪩', image: 'night', price: '£6', organizer: 'Students\' Association (sample)', rel: 8 }],
  [2, '10:00', '13:00', 'outdoor', 'Kinnaird Head Trail Walk', 'Kinnaird Head',
    'A scenic clifftop walk with views over the Bay. All fitness levels.', { emoji: '🥾', image: 'ocean', price: 'Free', organizer: 'Outdoor Society (sample)', rel: 6 }],
  [3, '18:00', '22:00', 'societies', 'Societies Fair: Meet Your Clubs', 'University Quad',
    'Browse 100+ societies, find your people, sign up to new clubs.', { emoji: '🧑‍🤝‍🧑', image: 'berry', price: 'Free', organizer: 'Students\' Association (sample)', rel: 9 }],
  [3, '19:30', '23:30', 'music', 'Acoustic Sessions & Poetry', 'South Street',
    'An intimate evening of acoustic music and open poetry.', { emoji: '🎸', image: 'ember', price: 'Free', organizer: 'Community (sample)', rel: 4 }],
  [3, '14:00', '16:30', 'careers', 'Graduate Recruitment: Careers Fair (mini)', 'The SA',
    'Meet employers, drop your CV, and book a chat. Bring a few printed copies.', { emoji: '💼', image: 'sky', price: 'Free', organizer: 'Careers Service (sample)', rel: 9 }],
  [4, '17:00', '21:00', 'arts', 'Comedy Show: Best of the Night', 'Town hall hall',
    'A stacked lineup of student and guest comedians.', { emoji: '😂', image: 'gold', price: '£10', organizer: 'Comedy Society (sample)', rel: 5 }],
  [4, '18:30', '20:30', 'food', 'Wine & Cheese Night', 'The Square',
    'Tasting evening with a local sommelier and cheeses from the region.', { emoji: '🧀', image: 'plum', price: '£18', organizer: 'Community (sample)', rel: 5 }],
  [4, '19:00', '21:00', 'university', 'Student Voice Forum', 'University',
    'Have your say on student life. Bring questions for the SA reps.', { emoji: '🎓', image: 'berry', price: 'Free', organizer: 'University (sample)', rel: 9 }],
  [5, '12:00', '16:00', 'charity', 'Charity Fun Run', 'Tay Park',
    'A 5k fun run to raise money for a local cause. Costumes encouraged.', { emoji: '🏃', image: 'grass', price: '£8', organizer: 'Charity (sample)', rel: 7 }],
  [5, '20:00', '23:30', 'nightlife', '80s/90s Throwback Dance', 'The SA',
    'Big hits, neon and a bit of friendly chaos.', { emoji: '🕺', image: 'night', price: '£5', organizer: 'Dance Society (sample)', rel: 6 }],
  [6, '18:00', '22:00', 'sport', 'Rugby Match: St Andrews vs. Edinburgh', 'Sports Ground',
    'Home fixture. Bring your loudest voice. Tickets on the day.', { emoji: '🏉', image: 'grass', price: '£5', organizer: 'St Andrews RFC (sample)', rel: 8 }],
  [6, '13:00', '15:00', 'outdoor', 'Beach Yoga', 'Saltcoats',
    'Sunrise-adjacent yoga on the sand. Mats provided.', { emoji: '🧘', image: 'ocean', price: '£10', organizer: 'Wellness Society (sample)', rel: 5 }],
  [7, '19:00', '22:00', 'music', 'Student Choir Performance', 'Old Town',
    'An evening of choral music, student and guest pieces.', { emoji: '🎼', image: 'berry', price: 'Free', organizer: 'Choir Society (sample)', rel: 6 }],
  [9, '10:00', '18:00', 'university', 'Orientation Day (returning students)', 'University',
    'Welcome back! Refreshments, info stands and the official welcome talk.', { emoji: '🎓', image: 'sky', price: 'Free', organizer: 'University (sample)', rel: 10 }],
  [10, '19:30', '23:00', 'arts', 'Film Club: Director\'s Cut', 'The SA',
    'A special screening followed by a Q&A with the society.', { emoji: '🎬', image: 'plum', price: '£4', organizer: 'Film Society (sample)', rel: 5 }],
];

function demoEvents() {
  return SEEDS.map(([off, st, en, c, title, loc, desc, x], i) => {
    const { date, time } = iso(off, st);
    const category = cat(c);
    return {
      title: `${title}`,
      description: desc,
      date,
      startTime: time,
      endTime: en,
      location: loc,
      address: 'St Andrews, Fife',
      category: c,
      price: x.price,
      ticketUrl: x.ticketUrl || null,
      organizer: x.organizer,
      image: x.image,
      emoji: x.emoji || category.emoji,
      reliability: x.rel || 5,
      sourceName: x.organizer,
      sourceUrl: null,
    };
  });
}

const TOWN_SEEDS = [
  [0, 'transport', 'Bus 1 & 5: slight delays on Castle Street', 'Engineering work on Castle Street this afternoon. Expect 10–15 min delays on the 1 and 5. Bus 6 is running normally.', 'Fife bus info (sample)'],
  [0, 'weather', 'Windy with showers later this week', 'A blustery week with periods of rain. Bring a coat — it\'s the East Coast, after all.', 'Weather (sample)'],
  [1, 'road', 'Main Street: pedestrianisation on weekends', 'Main Street becomes pedestrian-only from Friday to Sunday. Cyclists to use the route via Castle Street.', 'Town council (sample)'],
  [1, 'business', 'New independent bookshop opens on South Street', 'A small independent bookshop opens its doors this week — pre-orders available in store.', 'Local business (sample)'],
  [2, 'council', 'Recycling & waste collection: extra pickup', 'An additional recycling pickup is scheduled for this week. Leave bins out by 7am.', 'Town council (sample)'],
  [2, 'community', 'Tay Park community clean-up', 'Join the monthly clean-up. Gloves and bags provided, coffee afterwards.', 'Community group (sample)'],
  [3, 'student', 'Student bus pass renewals now open', 'The new-semester student bus pass renewals are now open. Renew online before the deadline.', 'Student info (sample)'],
  [3, 'news', 'Harbour area lighting upgraded', 'New lighting installed along the harbour for evening safety. Thanks for your patience.', 'Town council (sample)'],
  [4, 'transport', 'Saltcoats shuttle runs added for the weekend', 'Extra shuttle services to Saltcoats beach on the weekend. Free for students with ID.', 'Transport (sample)'],
];
function demoTownUpdates() {
  return TOWN_SEEDS.map(([off, c, title, body, src]) => {
    const { date } = iso(off);
    return { category: c, title, body, sourceName: src, date };
  });
}

const UNI_SEEDS = [
  [0, 'notices', 'Semester timetables published', 'Your timetable for this semester is now live in the student portal. Check it for any clashes.', 1],
  [0, 'academic', 'Library extended hours during exam period', 'The main library will be open 24 hours during the upcoming assessment period.', 0],
  [1, 'exams', 'Assessment period dates confirmed', 'The exact dates for the assessment period have been confirmed. See the portal for your personal schedule.', 1],
  [1, 'student_services', 'Wellbeing support: drop-in sessions', 'Free drop-in sessions with the student wellbeing team are running this week in the hub.', 0],
  [2, 'careers', 'CV check service now booking slots', 'Book a 1:1 CV check with the careers service. A few slots remain for this week.', 0],
  [2, 'accommodation', 'Halls maintenance schedule published', 'The planned maintenance schedule for halls is published. Check your building\'s noticeboard.', 0],
  [3, 'news', 'New research centre to open on campus', 'A new interdisciplinary research centre is set to open on campus next term.', 0],
  [3, 'sports', 'University sports: open enrolment', 'Open enrolment for university club sports is now open. Choose your club before it fills up.', 0],
];
function demoUniversityUpdates() {
  return UNI_SEEDS.map(([off, c, title, body, important]) => {
    const { date } = iso(off);
    return { category: c, title, body, important: !!important, date, sourceName: 'University (sample)' };
  });
}

const PLACE_SEEDS = [
  ['The Burr O\'Reilly\'s', 'restaurant', 'North Street', 'A refined spot for dinners and celebrations.', '🍽️', 'gold', '17:00–23:00', 4.6, 128],
  ['The Larder', 'cafe', 'The Square', 'A well-loved cafe — coffee, cakes and a relaxed seat.', '☕', 'ember', '07:30–17:00', 4.5, 210],
  ['The Castle Rock Tavern', 'bar', 'Castle Street', 'Trad music, good pints and a great atmosphere.', '🍺', 'night', '11:00–01:00', 4.4, 176],
  ['Tay Park Tearoom', 'cafe', 'Tay Park', 'Tea and snacks with a view of the park.', '🫖', 'grass', '10:00–16:00', 4.3, 89],
  ['The Old Course Bar', 'bar', 'West Sands', 'Riverside drinks with a sea view.', '🥂', 'ocean', '12:00–23:00', 4.2, 64],
  ['Book Nook', 'shop', 'South Street', 'Independent bookshop, stationery and gifts.', '📚', 'berry', '09:00–18:00', 4.7, 143],
  ['Saltcoats Ice Cream', 'entertainment', 'Saltcoats', 'Famous ice cream — a town legend.', '🍦', 'plum', '10:00–20:00', 4.8, 301],
  ['St Andrews Gym & Yoga', 'gym', 'Main Street', 'Fitness classes, gym floor and yoga.', '💪', 'sky', '06:00–23:00', 4.4, 97],
  ['The Hive', 'service', 'Castle Street', 'A bright student space for study, work and socialising.', '🐝', 'berry', '08:00–22:00', 4.5, 156],
  ['Fife Music Store', 'shop', 'North Street', 'Instruments, lessons and a listening room.', '🎸', 'ember', '10:00–18:00', 4.6, 72],
];
function demoPlaces() {
  return PLACE_SEEDS.map(([name, c, address, desc, emoji, image, hours, rating, rc]) => ({
    name, category: c, address, description: desc, emoji, image, hours, rating, review_count: rc,
  }));
}

// A single fresh, clearly-sample event for the "always alive" ticker.
const LIVE_TITLES = [
  ['Pop-up Vinyl Night', 'music', '🎵', 'ember'],
  ['Spontaneous Beach BBQ', 'outdoor', '🏖️', 'ocean'],
  ['Board Game Meetup', 'societies', '🎲', 'berry'],
  ['Trivia Tuesday (extra round)', 'nightlife', '🧠', 'night'],
  ['Street Food Pop-up', 'food', '🌮', 'gold'],
];
function demoLiveEvent(n) {
  const t = LIVE_TITLES[n % LIVE_TITLES.length];
  const off = n > LIVE_TITLES.length ? 1 : 0;
  const { date } = iso(off);
  return {
    title: `${t[0]} (just posted)`,
    description: 'A brand-new sample event that just came in from the feed.',
    date, startTime: '19:00', endTime: '22:00', location: 'Town centre', address: 'St Andrews, Fife',
    category: t[1], emoji: t[2], image: t[3], price: 'Free', organizer: 'Community (sample)', reliability: 4,
    sourceName: 'Community (sample)', sourceUrl: null,
  };
}

module.exports = { demoEvents, demoTownUpdates, demoUniversityUpdates, demoPlaces, demoLiveEvent };
