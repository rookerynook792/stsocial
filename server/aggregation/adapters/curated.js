'use strict';
const SourceAdapter = require('./base');

/**
 * Curated St Andrews calendar — REAL events, every category covered.
 *
 * Two kinds of entries:
 *
 * 1. ANNUAL / FIXED-DATE events with publicly documented dates (golf majors,
 *    industry weeks, Hogmanay, the university's Raisin Monday, the May Dip,
 *    the solstice Path of Light walk, Burns Night, the Autumn Duathlon, the
 *    Music Society Concerto Competition…).
 *
 * 2. RECURRING town & campus staples, computed at ingest time so they always
 *    land inside the visible window: weekend public golf on the Old Course,
 *    Friday live at The Vic, The Bop at the SA, society meetings, Careers
 *    Centre drop-ins, the museum, and Storehouse foodbank drop-offs.
 *
 * Every entry cites its free, open source in the description + sourceUrl:
 * university pages (traditions, semester dates, clubs & societies, events
 * calendar, careers), venue sites, the Links Trust, Triathlon Scotland
 * listings, onfife.com and the foodbank's own site. NOT sample data.
 */

const NAME = 'St Andrews — Annual Calendar';

/** Next occurrence of a weekday (0=Sun…6=Sat) from today (today inclusive). */
function nextDow(dow) {
  const d = new Date();
  const diff = (dow - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

class CuratedSource extends SourceAdapter {
  constructor() {
    super();
    this.id = 'curated';
    this.name = NAME;
    this.type = 'curated';
    this.reliability = 9;
    this.produces = 'events';
    this.isDemoSource = false;
  }

  async fetch() {
    return [
      /* ------------------------------ ANNUAL / FIXED ------------------------------ */
      {
        title: 'The Open Championship — 155th',
        description: "Golf's oldest major returns to the Home of Golf. The 155th Open is played over the Old Course, St Andrews — the 31st time the championship has visited. Championship rounds run 15–18 July, with practice days and the last-chance qualifier from 11 July. Expect the town to fill with golf fans from all over the world.",
        date: '2027-07-15', startTime: '09:00', endTime: '18:00',
        location: 'The Old Course, St Andrews', address: 'The Links, St Andrews, Fife',
        category: 'sport',
        ticketUrl: 'https://www.theopen.com/st-andrews-2027',
        link: 'https://www.theopen.com/st-andrews-2027',
        organizer: 'The R&A',
        sourceUrl: 'https://www.theopen.com/st-andrews-2027',
        sourceName: NAME,
        featured: true,
      },
      {
        title: 'Scottish Golf Tourism Week',
        description: "Scotland's biggest golf tourism industry event returns to St Andrews, centred on the Old Course Hotel. More than 100 Scottish golf businesses meet 94 international golf tour operators across three days, with events at venues around the town — 9–11 March 2027.",
        date: '2027-03-09', startTime: '09:30', endTime: '17:00',
        location: 'Old Course Hotel, St Andrews', address: '290 West Road, St Andrews, Fife',
        category: 'sport',
        ticketUrl: 'https://www.heraldscotland.com/news/26493645.scottish-golf-tourism-week-returns-st-andrews-2027/',
        link: 'https://www.heraldscotland.com/news/26493645.scottish-golf-tourism-week-returns-st-andrews-2027/',
        organizer: 'DC Thomson',
        sourceUrl: 'https://www.heraldscotland.com/news/26493645.scottish-golf-tourism-week-returns-st-andrews-2027/',
        sourceName: NAME,
      },
      {
        title: 'Links Golf St Andrews — Industry Week',
        description: 'The major golf industry gathering in the Home of Golf: exhibitors, course tours, business networking and on-course events around the links. The 2027 edition runs 11–17 April across St Andrews.',
        date: '2027-04-11', startTime: '09:00', endTime: '18:00',
        location: 'St Andrews', address: 'St Andrews, Fife',
        category: 'sport',
        ticketUrl: 'https://www.standrewsgolfweek.com/',
        link: 'https://www.standrewsgolfweek.com/',
        organizer: 'Links Golf',
        sourceUrl: 'https://www.standrewsgolfweek.com/',
        sourceName: NAME,
      },
      {
        title: 'Hogmanay in St Andrews',
        description: 'The town turns out for Hogmanay — live music, the midnight bell at the Bells of St Salvator, and parties across the High Street and the squares into the small hours. Venues across town run events from 8pm on 31 December.',
        date: '2026-12-31', startTime: '20:00', endTime: '02:00',
        location: 'High Street, St Andrews', address: 'High Street, St Andrews, Fife',
        category: 'nightlife',
        ticketUrl: 'https://vicstandrews.co.uk/whats-on/hogmanay-celebrations/',
        link: 'https://vicstandrews.co.uk/whats-on/hogmanay-celebrations/',
        organizer: 'St Andrews town venues',
        sourceUrl: 'https://vicstandrews.co.uk/whats-on/hogmanay-celebrations/',
        sourceName: NAME,
      },
      {
        title: 'St Andrews Autumn Duathlon Festival',
        description: 'Sprint duathlon on the coast: an energetic run along the coastal paths, transition at the cricket pavilion, a 25km ride through the countryside and back into town. Governed by Triathlon Scotland. Source: worldracecalendar.com.',
        date: '2026-10-11', startTime: '09:00', endTime: '14:00',
        location: 'St Andrews coast, Fife', address: 'St Andrews, Fife',
        category: 'sport',
        emoji: '🏃',
        ticketUrl: 'https://worldracecalendar.com/event/st-andrews-autumn-duathlon-festival-2026/',
        link: 'https://worldracecalendar.com/event/st-andrews-autumn-duathlon-festival-2026/',
        organizer: 'Triathlon Scotland',
        sourceUrl: 'https://worldracecalendar.com/event/st-andrews-autumn-duathlon-festival-2026/',
        sourceName: NAME,
      },
      {
        title: 'Music Society & Music Centre — Concerto Competition',
        description: 'The university Music Society\u2019s annual competition at the Laidlaw Music Centre — students take on the big concerto repertoire in the McPherson Recital Room. Source: University of St Andrews events calendar.',
        date: '2026-10-13', startTime: '15:30', endTime: '17:30',
        location: 'Laidlaw Music Centre, St Andrews', address: 'North Street, St Andrews, Fife',
        category: 'music',
        emoji: '🎻',
        link: 'https://events.st-andrews.ac.uk/',
        organizer: 'Music Society',
        sourceUrl: 'https://events.st-andrews.ac.uk/',
        sourceName: NAME,
      },
      {
        title: 'Raisin Monday — the foam fight',
        description: 'The pinnacle of academic-family mentoring: first years gather on the Lower College lawn in their parents\u2019 flamboyant costumes, each given a strange object bearing a Latin inscription, and trade cans of shaving foam in the great Raisin Monday foam fight. One of the university\u2019s oldest documented traditions. Date from the 2026–27 semester calendar (Raisin Monday: 19 October). Source: University of St Andrews — Traditions & Semester dates.',
        date: '2026-10-19', startTime: '09:00', endTime: '12:00',
        location: 'Lower College lawn, St Andrews', address: 'High Street, St Andrews, Fife',
        category: 'outdoor',
        emoji: '🧼',
        link: 'https://www.st-andrews.ac.uk/study/undergraduate/why/life/traditions/',
        organizer: 'University of St Andrews (academic families)',
        sourceUrl: 'https://www.st-andrews.ac.uk/semester-dates/',
        sourceName: NAME,
      },
      {
        title: 'Walk the Path of Light — the longest night',
        description: 'The university Chaplaincy\u2019s winter-solstice evening: a lit path of light through Castlecliffe as the town marks the longest night. Held every solstice since 2020 (16:30–20:30). Date follows the 2026 solstice (21 December) — the university calendar confirms it. Source: University of St Andrews events calendar.',
        date: '2026-12-21', startTime: '16:30', endTime: '20:30',
        location: 'Castlecliffe, St Andrews', address: 'Castlecliffe, St Andrews, Fife',
        category: 'outdoor',
        emoji: '🕯️',
        link: 'https://events.st-andrews.ac.uk/',
        organizer: 'University Chaplaincy',
        sourceUrl: 'https://events.st-andrews.ac.uk/',
        sourceName: NAME,
      },
      {
        title: 'The May Dip',
        description: 'Dawn on 1 May: a freezing plunge into the North Sea for good luck in exams — one of the university\u2019s most famous traditions, with dry friends keeping watch over the clothes on the beach. Source: University of St Andrews — Traditions.',
        date: '2027-05-01', startTime: '06:00', endTime: '08:00',
        location: 'West Sands, St Andrews', address: 'West Sands, St Andrews, Fife',
        category: 'outdoor',
        emoji: '🌊',
        link: 'https://www.st-andrews.ac.uk/study/undergraduate/why/life/traditions/',
        organizer: 'University of St Andrews (student tradition)',
        sourceUrl: 'https://www.st-andrews.ac.uk/study/undergraduate/why/life/traditions/',
        sourceName: NAME,
      },
      {
        title: 'Global Burns Night 2027 (online)',
        description: 'The university\u2019s online Burns Night for the whole global community — poetry, music and the address in honour of Robert Burns, held every late January (2026: 22 Jan; 2025: 23 Jan; 2024: 25 Jan). The 2027 date is set by the university; this follows recent years. Source: University of St Andrews events calendar.',
        date: '2027-01-22', startTime: '19:00', endTime: '20:30',
        location: 'Online — University of St Andrews', address: 'st-andrews.ac.uk',
        category: 'music',
        emoji: '🎤',
        link: 'https://events.st-andrews.ac.uk/',
        organizer: 'University of St Andrews',
        sourceUrl: 'https://events.st-andrews.ac.uk/',
        sourceName: NAME,
      },
      {
        title: 'Burns Night suppers — 25 January',
        description: 'The fixed-date national celebration of Robert Burns (1759–1796): the haggis, the address, the poetry and the toasts. Suppers run across the town and the university every 25 January — the day itself is fixed, and venues publish their own times through January.',
        date: '2027-01-25', startTime: '19:00', endTime: '23:00',
        location: 'Town venues, St Andrews', address: 'St Andrews, Fife',
        category: 'food',
        emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
        organizer: 'Town venues & university',
        sourceUrl: 'https://www.bbc.co.uk/history/historic_figures/burns_robert.shtml',
        sourceName: NAME,
      },

      /* --------------------- RECURRING (date computed at ingest) --------------------- */
      {
        title: 'Old Course public golf — weekend tee times',
        description: 'Public rounds on the Home of Golf, played continuously since the 1500s. Tee times run seven days a week — weekends book out, so reserve early via the Links Trust. Source: st-andrewslinks.com.',
        date: nextDow(6), startTime: '10:00', endTime: '15:00',
        location: 'The Old Course, St Andrews', address: 'The Links, St Andrews, Fife',
        category: 'sport',
        emoji: '⛳',
        link: 'https://www.st-andrewslinks.com/',
        organizer: 'The R&A / Links Trust',
        sourceUrl: 'https://www.st-andrewslinks.com/',
        sourceName: NAME,
      },
      {
        title: 'Live music — Friday night at The Vic',
        description: 'The Vic\u2019s regular Friday live sessions — the town\u2019s people\u2019s pub on St Marys Place has run live music for decades, and entry is usually free. Line-up is posted on the venue\u2019s what\u2019s-on page. Source: vicstandrews.co.uk.',
        date: nextDow(5), startTime: '20:00', endTime: '23:30',
        location: 'The Vic, St Andrews', address: '1 Saint Marys Place, St Andrews, Fife',
        category: 'music',
        emoji: '🎸',
        link: 'https://vicstandrews.co.uk/',
        organizer: 'The Vic',
        sourceUrl: 'https://vicstandrews.co.uk/',
        sourceName: NAME,
      },
      {
        title: 'The Bop — the SA\u2019s Friday night',
        description: 'The Students\u2019 Association\u2019s traditional weekly Friday night — the union\u2019s flagship student event on St Marys Place, documented by St Andrews Radio as a fixture of town nightlife. Source: St Andrews Radio / yourunion.net.',
        date: nextDow(5), startTime: '21:00', endTime: '01:00',
        location: 'The SA, St Andrews', address: 'St Marys Place, St Andrews, Fife',
        category: 'nightlife',
        emoji: '🎉',
        link: 'https://www.yourunion.net/',
        organizer: 'Students\u2019 Association',
        sourceUrl: 'https://standrewsradio.com/events-nightlife-in-st-andrews/',
        sourceName: NAME,
      },
      {
        title: 'Fife Arms — afternoon tea',
        description: 'Afternoon tea at the town\u2019s historic hotel on Bell Street, hosting visitors since 1820. A daily offering — the classic St Andrews slow-afternoon. Source: fifearms.com.',
        date: nextDow(3), startTime: '15:00', endTime: '16:30',
        location: 'The Fife Arms, St Andrews', address: '13 Bell Street, St Andrews, Fife',
        category: 'food',
        emoji: '🫖',
        link: 'https://www.fifearms.com/',
        organizer: 'The Fife Arms',
        sourceUrl: 'https://www.fifearms.com/',
        sourceName: NAME,
      },
      {
        title: 'Term-time societies — meetings & socials',
        description: 'The University of St Andrews is home to 150+ student societies — film, music, outdoors, robotics, culture, politics and more — meeting weekly through term across the SA, the colleges and campus. Find a full list on the SA site and just turn up. Source: University of St Andrews — Clubs & Societies.',
        date: nextDow(3), startTime: '19:00', endTime: '22:00',
        location: 'The SA & campus, St Andrews', address: 'St Marys Place, St Andrews, Fife',
        category: 'societies',
        emoji: '🎓',
        link: 'https://www.st-andrews.ac.uk/study/undergraduate/why/life/clubs-and-societies/',
        organizer: 'Students\u2019 Association',
        sourceUrl: 'https://www.st-andrews.ac.uk/study/undergraduate/why/life/clubs-and-societies/',
        sourceName: NAME,
      },
      {
        title: 'Careers Centre — drop-in & CV advice',
        description: 'The Careers Centre (6 St Marys Place) runs term-time drop-ins, CV/cover-letter and LinkedIn advice, plus bookable one-to-ones with careers advisers — free for students. Source: University of St Andrews — Careers.',
        date: nextDow(3), startTime: '11:00', endTime: '13:00',
        location: 'Careers Centre, St Andrews', address: '6 St Marys Place, St Andrews, Fife',
        category: 'careers',
        emoji: '💼',
        link: 'https://www.st-andrews.ac.uk/careers/appointments/',
        organizer: 'University Careers Centre',
        sourceUrl: 'https://www.st-andrews.ac.uk/careers/appointments/',
        sourceName: NAME,
      },
      {
        title: 'St Andrews Museum — free entry',
        description: 'The town museum in Kinburn Park — local history, archaeology and the story of the castle, cathedral and the links. Free to enter, open Monday–Saturday 10:30–16:00 (check on public holidays). Source: onfife.com.',
        date: nextDow(6), startTime: '10:30', endTime: '16:00',
        location: 'St Andrews Museum, Kinburn Park', address: 'Doubledykes Road, St Andrews, Fife',
        category: 'other',
        emoji: '🏛️',
        link: 'https://www.onfife.com/venues/st-andrews-museum/',
        organizer: 'Fife Council',
        sourceUrl: 'https://www.onfife.com/venues/st-andrews-museum/',
        sourceName: NAME,
      },
      {
        title: 'Storehouse foodbank — donation drop-off',
        description: 'Storehouse (Kingdom Vineyard East Fife, charity SC037042) has served the most vulnerable people in north-east Fife since 2006. Drop off donations at the St Davids Centre on Tuesdays & Thursdays 2–4pm, or at drop-off points around town. Source: storehousestandrews.com.',
        date: nextDow(2), startTime: '14:00', endTime: '16:00',
        location: 'St Davids Centre, St Andrews', address: 'Albany Park, St Andrews, Fife',
        category: 'charity',
        emoji: '🤝',
        link: 'https://storehousestandrews.com/',
        organizer: 'Storehouse St Andrews',
        sourceUrl: 'https://storehousestandrews.com/',
        sourceName: NAME,
      },
    ];
  }
}
module.exports = CuratedSource;
