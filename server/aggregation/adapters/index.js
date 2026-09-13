'use strict';
/**
 * Adapter registry.
 *
 * To add a new ingestion source:
 *   1. Write an adapter class in this folder.
 *   2. Register it in this map.
 *   3. Enable it (or let admins add it) via the admin dashboard / source table.
 *
 * The pipeline resolves a source row's `type` to one of these adapters.
 */
const UniversitySource = require('./university');
const StudentsAssocSource = require('./studentsAssoc');
const VenueSource = require('./venue');
const EventsFeedSource = require('./eventsFeed');
const TownFeedSource = require('./townFeed');
const UniversityFeedSource = require('./universityFeed');
const RssSource = require('./rss');

const ADAPTERS = {
  university: UniversitySource,
  students_assoc: StudentsAssocSource,
  venue: VenueSource,
  events_feed: EventsFeedSource,
  town_feed: TownFeedSource,
  university_feed: UniversityFeedSource,
  rss: RssSource,
};

// A source "type" an admin can choose when adding a source.
const AVAILABLE_SOURCE_TYPES = [
  { id: 'university', label: 'University of St Andrews events', produces: 'events', reliability: 10 },
  { id: 'students_assoc', label: "Students' Association & societies", produces: 'events', reliability: 8 },
  { id: 'venue', label: 'Local venue / restaurant calendar', produces: 'events', reliability: 6 },
  { id: 'events_feed', label: 'Community / public events feed', produces: 'events', reliability: 4 },
  { id: 'town_feed', label: 'Town updates (council, transport, weather)', produces: 'town', reliability: 8 },
  { id: 'university_feed', label: 'University official notices', produces: 'university', reliability: 10 },
  { id: 'rss', label: 'Custom RSS / Atom feed', produces: 'events', reliability: 5 },
];

function createAdapter(type) {
  const Cls = ADAPTERS[type];
  return Cls ? new Cls() : null;
}

module.exports = { ADAPTERS, AVAILABLE_SOURCE_TYPES, createAdapter };
