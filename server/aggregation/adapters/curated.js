'use strict';
const SourceAdapter = require('./base');

/**
 * Curated St Andrews annual / seasonal events.
 *
 * These are REAL, well-known recurring events in St Andrews (golf majors,
 * industry weeks, the town's Hogmanay) with publicly announced dates. They are
 * NOT sample data — they actually happen — but they are static entries that
 * complement the live feeds (which provide week-to-week content).
 *
 * Each run returns the full list; the pipeline de-duplicates by title+date,
 * so this is idempotent.
 */

const NAME = 'St Andrews — Annual Calendar';

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
    ];
  }
}
module.exports = CuratedSource;
