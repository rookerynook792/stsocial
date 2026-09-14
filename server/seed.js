'use strict';
/**
 * Seeds DEMO users, forum content, notifications, societies and the local
 * places catalog. Events / town / university data are produced by the
 * aggregation pipeline on startup (see scheduler).
 *
 *   npm run seed          → seed if empty
 *   npm run seed --reset  → wipe and reseed
 *   require('./seed').seed() → idempotent, used by the server on boot
 */
const path = require('path');
const fs = require('fs');
const config = require('./config');

function resetDb() {
  for (const suffix of ['', '-wal', '-shm']) {
    const f = path.join(config.dataDir, `stsocial.db${suffix}`);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  console.log('Reset: removed database.');
}

function seed() {
  const { db } = require('./db');
  const { hashPassword } = require('./util');
  const { demoPlaces } = require('./aggregation/demoData');

  const existing = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  if (existing > 0) { console.log(`DB already seeded (${existing} users). Skipping.`); return false; }

  const now = Date.now();
  const H = 3600000, D = 86400000;
  const hash = (p) => { const h = hashPassword(p); return { salt: h.salt, hash: h.hash }; };

  const addUser = (u) => {
    const { salt, hash: hh } = hash(u.password || 'stsocial123');
    const res = db.prepare(`
      INSERT INTO users (name, username, email, password_hash, password_salt, avatar, course, year, bio, interests, role, verified, privacy, status, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(u.name, u.username, u.email, hh, salt, u.avatar || null, u.course || null, u.year || null,
      u.bio || '', JSON.stringify(u.interests || []), u.role || 'student', u.verified ? 1 : 0, u.privacy || 'public', 'active', now - (u.ageD || 10) * D);
    return res.lastInsertRowid;
  };

  // Always create the functional admin account (present in both demo and live mode).
  console.log('Creating admin account…');
  const adminId = addUser({ name: 'ST SOCIAL Team', username: 'stsocial', email: 'admin@stsocial.app', password: 'stsocial-admin', avatar: '🦉', role: 'admin', verified: 1, bio: 'We keep ST SOCIAL running. Say hi!', interests: ['community'] });

  if (!config.demoMode) {
    console.log('\n✅ Seed complete (LIVE mode — no sample data).');
    console.log('   Admin   : admin@stsocial.app / stsocial-admin');
    console.log('   Live sources will populate content on the next ingest.');
    return true;
  }

  console.log('Seeding demo users…');
  const ids = { stsocial: adminId };
  const users = [
    { name: 'Riley Fraser', username: 'rileyf', email: 'rileyf@st-andrews.ac.uk', avatar: '🎒', course: 'BSc Geography', year: '3rd year', verified: 1, bio: 'Maps, beaches and bad karaoke.', interests: ['hiking', 'photography', 'rugby'] },
    { name: 'Amara Okafor', username: 'amara', email: 'amara.o@st-andrews.ac.uk', avatar: '⚖️', course: 'MA Law', year: '2nd year', verified: 1, interests: ['debate', 'reading', 'coffee'] },
    { name: 'Tom Boyd', username: 'tomboyd', email: 'tom.boyd@st-andrews.ac.uk', avatar: '🏉', course: 'BA Philosophy', year: '4th year', verified: 1, bio: 'Rugby 1st XV. Ask me about ethics or scrums.', interests: ['rugby', 'folk', 'food'] },
    { name: 'Lily Chen', username: 'lilychen', email: 'lily.chen@st-andrews.ac.uk', avatar: '💻', course: 'BSc Computer Science', year: '1st year', verified: 1, interests: ['gaming', 'music', 'baking'] },
    { name: 'Noah Smith', username: 'noahs', email: 'noahs@st-andrews.ac.uk', avatar: '🌊', course: 'MPhys Physics', year: '3rd year', verified: 1, interests: ['kayaking', 'chess'] },
    { name: 'Guest Student', username: 'guest', email: 'guest@gmail.com', avatar: '👤', privacy: 'students', interests: [] },
  ];
  for (const u of users) ids[u.username] = addUser(u);
  const [me, riley, amara, tom, lily, noah, guest] = [ids.stsocial, ids.rileyf, ids.amara, ids.tomboyd, ids.lilychen, ids.noahs, ids.guest];

  console.log('Seeding forum posts…');
  const addPost = ({ user, type, title, body, ageH, up, down }) => {
    const res = db.prepare(`
      INSERT INTO posts (user_id, type, title, body, created_at, upvotes, downvotes, approved, status, is_demo)
      VALUES (?,?,?,?,?,?,?,1,'published',1)
    `).run(user, type, title || null, body, now - ageH * H, up, down);
    return res.lastInsertRowid;
  };
  const p = {};
  p.friday = addPost({ user: lily, type: 'discussion', title: "Anyone know what's happening this Friday?", body: "Trying to plan the weekend and the events page is a bit overwhelming. What's actually good to go to on Friday night? Be specific please 🙏", ageH: 5, up: 24, down: 2 });
  p.card = addPost({ user: noah, type: 'lostfound', title: 'Lost my student card near the pier', body: 'White St Andrews student card, dropped somewhere around the pier this morning. If anyone finds it please DM. £5 reward 🙏', ageH: 3, up: 18, down: 0 });
  p.fridge = addPost({ user: amara, type: 'buysell', title: 'Selling a mini fridge — £20', body: 'Small white mini fridge, works perfectly, comes with the original packaging. Pick up near the student halls. Cash on collection.', ageH: 8, up: 9, down: 1 });
  p.bonfire = addPost({ user: tom, type: 'event', title: 'Beach bonfire tonight 🔥', body: "We're lighting a fire on the beach at 8. Bring a blanket and a warm drink. All welcome, first-timers especially.", ageH: 6, up: 41, down: 1 });
  p.rugby = addPost({ user: tom, type: 'question', title: 'Anyone going to the rugby?', body: 'St Andrews vs Edinburgh this weekend — does anyone know what time tickets go on sale and roughly how much they are?', ageH: 20, up: 15, down: 0 });
  p.eats = addPost({ user: riley, type: 'recommendation', title: 'Best cheap eats in town?', body: 'First proper week here and my budget is not huge. Where do you all grab cheap but decent food? Cafes with student rates?', ageH: 30, up: 33, down: 2 });
  p.barcrawl = addPost({ user: amara, type: 'announcement', title: 'SA bar crawl is back on Thursday', body: "The students' association bar crawl is returning Thursday night. First bus leaves from the Square at 7. Register on the SA site — spots go fast.", ageH: 40, up: 52, down: 3 });
  p.photo = addPost({ user: riley, type: 'society', title: 'Photography Society — first shoot this week', body: "We're doing a sunset beach walk + shoot on Saturday afternoon. Bring a camera if you have one, phones are fine. New members very welcome.", ageH: 26, up: 21, down: 0 });
  p.room = addPost({ user: noah, type: 'accommodation', title: 'Room to rent, 5 min from campus', body: 'Small single room in a friendly shared house, available from next month. ~£450/mo, bills included. DM for photos and more info.', ageH: 55, up: 12, down: 0 });
  p.bookshop = addPost({ user: lily, type: 'discussion', title: 'The new bookshop on South Street', body: 'Just went into the new bookshop that opened. Nice selection, fair prices and the owner let us browse for ages. 10/10 would recommend.', ageH: 12, up: 17, down: 1 });
  p.keys = addPost({ user: guest, type: 'lostfound', title: 'Found a set of keys by Tay Park', body: 'Found keys with a blue lanyard near the main gate at 3pm. Check the lost property desk or DM me with a description.', ageH: 9, up: 6, down: 0 });
  p.careers = addPost({ user: amara, type: 'careers', title: 'Careers fair this Friday — tips?', body: 'Heading to the mini careers fair Friday afternoon. Anyone have tips on which employers are actually worth talking to for law/consulting?', ageH: 15, up: 11, down: 0 });

  console.log('Seeding comments…');
  const addComment = (postId, user, body, ageH, up = 3) =>
    db.prepare(`INSERT INTO comments (post_id, user_id, body, created_at, upvotes, approved, status) VALUES (?,?,?,?,?,1,'published')`)
      .run(postId, user, body, now - ageH * H, up);
  addComment(p.friday, riley, 'The big club night at the SA is always worth it, honestly.', 4.5, 8);
  addComment(p.friday, tom, 'Second that. Or the folk session is a chill option if you want something quieter.', 4, 5);
  addComment(p.friday, lily, 'Wait so which one is 18+? Asking for a friend.', 3.8, 2);
  addComment(p.friday, amara, 'The one with the "club 21" in the title is the 18+ one.', 3.5, 6);
  addComment(p.card, noah, "I'll keep an eye out! Check around the bench by the lighthouse too.", 2.5, 4);
  addComment(p.card, riley, 'The pier cleaners collect found items — worth checking the ticket hut.', 2, 3);
  addComment(p.bonfire, riley, 'Count me in 🙌 is it the main beach or Saltcoats?', 5, 7);
  addComment(p.bonfire, tom, 'The main beach, South Street side. Look for the big tent.', 4.5, 9);
  addComment(p.bonfire, lily, 'brb bringing extra blankets and my best winter coat', 4, 5);
  addComment(p.eats, amara, 'The tearoom by the park is my go-to for cheap + decent. Try the meat pie.', 28, 11);
  addComment(p.eats, tom, 'If you can stretch it, the tasting menu place is unreal. The cafe on the Square for quick though.', 27, 6);
  addComment(p.barcrawl, lily, 'did anyone actually register or is it first come first serve?', 38, 3);
  addComment(p.barcrawl, amara, 'Register online, but the bus is first come first serve so go early.', 37, 4);

  console.log('Seeding votes / saves / follows…');
  const vote = (postId, user, v) => db.prepare('INSERT OR IGNORE INTO post_votes (user_id, post_id, value) VALUES (?,?,?)').run(user, postId, v);
  [vote(p.bonfire, me, 1), vote(p.bonfire, riley, 1), vote(p.bonfire, noah, 1), vote(p.friday, lily, 1),
   vote(p.eats, riley, 1), vote(p.eats, amara, 1), vote(p.barcrawl, amara, 1), vote(p.card, riley, 1)];
  const save = (postId, user) => db.prepare('INSERT OR IGNORE INTO post_saves (user_id, post_id, created_at) VALUES (?,?,?)').run(user, postId, now);
  const follow = (postId, user) => db.prepare('INSERT OR IGNORE INTO post_follows (user_id, post_id, created_at) VALUES (?,?,?)').run(user, postId, now);
  save(p.fridge, riley); save(p.eats, riley); save(p.room, riley); save(p.bookshop, riley);
  follow(p.friday, riley); follow(p.rugby, riley); follow(p.barcrawl, riley);

  console.log('Seeding notifications (for rileyf)…');
  const notif = (user, type, title, body, link, ageM, read = 0) =>
    db.prepare('INSERT INTO notifications (user_id, type, title, body, link, created_at, read) VALUES (?,?,?,?,?,?,?)').run(user, type, title, body, link, now - ageM * 60000, read);
  notif(riley, 'replies', 'New reply on your post', 'Amara Okafor replied to "Anyone know what\'s happening this Friday?"', '#/post/1', 18);
  notif(riley, 'event_reminder', 'Reminder: Beach bonfire tonight', "You're marked as going. Tonight at 8:00 PM on the main beach.", '#/event/1', 30);
  notif(riley, 'trending', 'Trending near you', '"SA bar crawl is back on Thursday" is one of the most discussed posts this week.', '#/post/7', 90);
  notif(riley, 'university', 'New notice from the University', 'Semester timetables published. Check your student portal.', '#/university', 200, 1);
  notif(riley, 'town', 'Town update: bus delays', 'Bus 1 & 5: slight delays on Castle Street this afternoon.', '#/town', 45);
  notif(riley, 'replies', 'Your followed discussion has activity', 'New comments on "Anyone going to the rugby?" which you follow.', '#/post/5', 300, 1);

  console.log('Seeding local places…');
  const placeIns = db.prepare(`
    INSERT INTO places (name, category, address, hours, website, description, rating, review_count, emoji, image, is_demo)
    VALUES (?,?,?,?,?,?,?,?,?,?,1)
  `);
  for (const pl of demoPlaces()) {
    placeIns.run(pl.name, pl.category, pl.address, pl.hours, 'example.com', pl.description, pl.rating, pl.review_count, pl.emoji, pl.image);
  }

  console.log('Seeding societies…');
  const societies = [
    ['Photography Society', '📷', 'Arts', 'Shoots, edits and exhibitions on and off campus.', 84],
    ['Rugby Football Club', '🏉', 'Sport', 'The university rugby club — all levels welcome.', 210],
    ['Dance Society', '🕺', 'Arts', 'Social dances, workshops and club nights every week.', 156],
    ['Outdoor & Mountaineering', '🏔️', 'Outdoor', 'Hikes, climbing and weekend adventures.', 132],
    ['Theatre Society', '🎭', 'Arts', 'Two main shows a year plus fringe performances.', 98],
    ['Film Society', '🎬', 'Arts', 'Weekly screenings and a student film night.', 143],
    ['Debate Society', '🗣️', 'Academic', 'Competitive and casual debate, all welcome.', 67],
    ['Music & Folk Society', '🎵', 'Arts', 'Folk sessions, open mics and gigs.', 121],
    ['Careers & Consulting', '💼', 'Careers', 'Networking, CV clinics and employer talks.', 178],
    ['Volunteering & Charity', '❤️', 'Charity', 'Fundraisers and volunteering across Fife.', 88],
    ['Gaming Society', '🎮', 'Lifestyle', 'Tournaments, LAN nights and chill gaming.', 165],
    ['Sake & Japanese Culture', '🍶', 'Culture', 'Language, food and culture meetups.', 74],
  ];
  const socIns = db.prepare('INSERT INTO societies (name, emoji, category, description, members, is_demo) VALUES (?,?,?,?,?,1)');
  for (const s of societies) socIns.run(...s);

  console.log('Seeding a pending community event + a report…');
  const cmDate = new Date(now + 2 * D);
  const cm = db.prepare(`
    INSERT INTO events (title, description, category, date, start_time, end_time, start_ms,
      location, address, price, organizer, creator_id, image, emoji, reliability, source_type,
      approved, status, is_demo, created_at)
    VALUES (@title, @description, @category, @date, @start_time, @end_time, @start_ms,
      @location, @address, @price, @organizer, @creator_id, 'berry', '🎳', 3, 'community',
      0, 'pending', 1, @created_at)
  `).run({
    title: 'Student Bowling Night',
    description: 'An evening of bowling, food and fun with the society. All welcome.',
    category: 'nightlife',
    date: cmDate.toISOString().slice(0, 10),
    start_time: '19:00',
    end_time: '22:00',
    start_ms: now + 2 * D + 19 * H,
    location: 'The Bowling Lounge',
    address: 'St Andrews, Fife',
    price: '£6',
    organizer: 'Bowling Society (sample)',
    creator_id: amara,
    created_at: Date.now(),
  });
  const eventId = cm.lastInsertRowid;
  db.prepare("INSERT INTO reports (target_type, target_id, reporter_id, reason, details, status, created_at) VALUES (?,?,?,?,?,'pending',?)")
    .run('event', eventId, amara, 'misleading', 'The location listed looks a bit off — is this in town or across the A91?', Date.now());

  db.prepare('INSERT INTO notifications_prefs (user_id, prefs) VALUES (?, ?)').run(riley, JSON.stringify({
    event_reminder: true, trending: true, replies: true, university: true, town: true,
  }));

  console.log('\n✅ Seed complete.');
  console.log('   Admin   : admin@stsocial.app        / stsocial-admin');
  console.log('   Student : rileyf@st-andrews.ac.uk   / stsocial123  (verified ✓)');
  console.log('   Student : amara.o@st-andrews.ac.uk  / stsocial123');
  return true;
}

/**
 * Remove sample/demo-flagged rows. Called on boot when demo mode is OFF, so a
 * database that was previously demo-seeded becomes a clean live database.
 */
function purgeDemo() {
  const { db } = require('./db');
  const counts = {};
  counts.events = db.prepare('DELETE FROM events WHERE is_demo = 1').run().changes;
  counts.posts = db.prepare('DELETE FROM posts WHERE is_demo = 1').run().changes;
  counts.comments = db.prepare('DELETE FROM comments WHERE post_id NOT IN (SELECT id FROM posts)').run().changes;
  counts.places = db.prepare('DELETE FROM places WHERE is_demo = 1').run().changes;
  counts.societies = db.prepare('DELETE FROM societies WHERE is_demo = 1').run().changes;
  try {
    counts.townUpdates = db.prepare('DELETE FROM town_updates WHERE is_demo = 1').run().changes;
    counts.uniUpdates = db.prepare('DELETE FROM university_updates WHERE is_demo = 1').run().changes;
  } catch { /* older schema without is_demo on those tables */ }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total > 0) console.log(`[live mode] purged demo rows: ${JSON.stringify(counts)}`);
}

module.exports = { seed, resetDb, purgeDemo };

if (require.main === module) {
  if (process.argv.includes('--reset')) resetDb();
  seed();
  process.exit(0);
}
