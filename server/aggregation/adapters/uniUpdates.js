'use strict';
const SourceAdapter = require('./base');

/**
 * University Verified Updates — REAL, verifiable University of St Andrews
 * information for every category in the University tab.
 *
 * Every entry is drawn from a free, official university (or Students'
 * Association) source, and the source is cited in sourceUrl:
 *   - 2026-27 key dates & deadlines for students (semester-dates page)
 *   - Semester dates 2026-2027
 *   - Accommodation page (4,000+ beds, drop-ins, contact)
 *   - Student support page (ASC, counselling, matched care)
 *   - Careers Centre
 *   - Clubs & societies page + the Students' Association directory
 *   - Saints Sport (Varsity fixtures)
 *
 * NOT sample data. Recurring staples carry their real published dates so the
 * categories stay accurate through the 2026-27 academic year.
 */

const NAME = 'University of St Andrews — Verified Updates';

const SRC = {
  keyDates: 'https://www.st-andrews.ac.uk/semester-dates/2026-2027/key-date-students/',
  semesterDates: 'https://www.st-andrews.ac.uk/semester-dates/',
  accommodation: 'https://www.st-andrews.ac.uk/accommodation/',
  support: 'https://www.st-andrews.ac.uk/study/support/student/',
  careers: 'https://www.st-andrews.ac.uk/careers/',
  societies: 'https://www.st-andrews.ac.uk/study/undergraduate/why/life/clubs-societies/',
  sport: 'https://sport.wp.st-andrews.ac.uk/',
  varsity: 'https://scottishvarsitymatch.com/',
  union: 'https://www.yourunion.net/activities/societies/',
};

class UniUpdatesSource extends SourceAdapter {
  constructor() {
    super();
    this.id = 'uniUpdates';
    this.name = NAME;
    this.type = 'uni_updates';
    this.reliability = 10;
    this.produces = 'university';
    this.isDemoSource = false; // real, verified content
  }

  async fetch() {
    return [
      /* ------------------------------ ACADEMIC ------------------------------ */
      {
        category: 'academic', date: '2026-09-14',
        title: 'Martinmas semester starts — teaching begins Monday 14 September 2026',
        body: 'Semester 1 is officially underway: teaching begins Monday 14 September 2026 for all students. If you are an entrant, online matriculation (open since 24 August) and advising (re-advising opens 14 September) must be completed — the deadline to complete both is 5 October. Check your timetable on the student portal.',
        sourceUrl: SRC.keyDates,
      },
      {
        category: 'academic', date: '2026-10-19',
        title: 'Independent Learning Week (ILW) + Raisin Monday — week of Monday 19 October 2026',
        body: 'Week 6 has no teaching: it is Independent Learning Week, the traditional self-study week. It doubles as Raisin Weekend — the famous Raisin Monday foam fight on the Lower College lawn (19 October), with objects bearing Latin inscriptions being tossed through the crowd. A rite of passage for every Saint.',
        sourceUrl: SRC.keyDates,
      },
      {
        category: 'academic', date: '2027-01-25',
        title: 'Candlemas semester starts — teaching begins Monday 25 January 2027',
        body: 'Semester 2 kicks off Monday 25 January 2027. Semester 1 module results are released Tuesday 19 January, and the halls move-in date for Semester 2 is Wednesday 20 January. Online matriculation for returners and entrants opens 5 January.',
        sourceUrl: SRC.keyDates,
      },
      {
        category: 'academic', date: '2027-03-01',
        title: 'Spring vacation — week of Monday 1 March 2027',
        body: 'No teaching during the week commencing 1 March 2027 (Spring vacation). A good fortnight to recharge before the final straight — or to go home if you can. Week 6 of teaching resumes Monday 8 March.',
        sourceUrl: SRC.semesterDates,
      },

      /* ------------------------------- EXAMS ------------------------------- */
      {
        category: 'exams', date: '2026-10-10',
        title: 'Semester 1 exams diet: Saturday 5 December – Monday 21 December 2026',
        body: 'The confirmed Semester 1 exams diet timetable is published Friday 10 October 2026 — check your exams and venues on the student portal. The diet runs 5–21 December 2026 (revision week begins 30 November; end of teaching 27 November). ScotGEM (Medicine) sits its own diet 14–18 December.',
        sourceUrl: SRC.keyDates,
      },
      {
        category: 'exams', date: '2027-05-08',
        title: 'Semester 2 exams diet: Saturday 8 May – Saturday 22 May 2027',
        body: 'Semester 2 teaching ends Friday 23 April 2027, with revision weeks in the weeks of 26 April and 3 May. The confirmed Semester 2 (and extended May) timetable is published Friday 12 March 2027. The main diet runs 8–22 May, with an extended examination diet following for remaining papers.',
        sourceUrl: SRC.keyDates,
      },
      {
        category: 'exams', date: '2026-11-13',
        title: 'Leave of Absence deadline (Semester 1): Friday 13 November 2026',
        body: 'Students who need a break of study in Semester 1 must apply for Leave of Absence by Friday 13 November 2026. The Semester 2 LoA deadline is 2 April 2027. Talk to Student Services first — the Advice and Support Centre can guide you through options.',
        sourceUrl: SRC.keyDates,
      },

      /* --------------------------- ACCOMMODATION --------------------------- */
      {
        category: 'accommodation', date: '2026-09-14',
        title: 'Entrant accommodation 2026-27: applications are open',
        important: true,
        body: 'The University has 4,000+ bed spaces, and accommodation is guaranteed for entrant undergraduate students (plus care-experienced and estranged students). Choose halls, University-managed houses/flats or private — University options run 34, 38 or 50-week contracts with heating, hot water, internet and insurance included. Apply at accommodation.st-andrews.ac.uk.',
        sourceUrl: SRC.accommodation,
      },
      {
        category: 'accommodation', date: '2026-09-14',
        title: 'Book an accommodation drop-in: Mon & Thu 10am–12pm, Tue & Wed 2–4pm',
        body: 'Student Accommodation Services runs online drop-in appointments every week — Mondays and Thursdays 10am to noon, Tuesdays and Wednesdays 2pm to 4pm. Ask about halls, prices, contracts and private renting. Email accommodation@st-andrews.ac.uk. The free night bus also serves University accommodation every night.',
        sourceUrl: SRC.accommodation,
      },
      {
        category: 'accommodation', date: '2026-12-22',
        title: 'Semester move dates: some halls depart 22 December; Semester 2 entry 20 January 2027',
        body: 'Tuesday 22 December 2026 is the halls departure day for some residences at the start of Christmas vacation. Halls of Residence Semester 2 entry date is Wednesday 20 January 2027, with orientation for January entrants 20–22 January. Check your hall’s specific dates — they vary by building.',
        sourceUrl: SRC.keyDates,
      },

      /* -------------------------- STUDENT SERVICES -------------------------- */
      {
        category: 'student_services', date: '2026-09-14',
        title: 'Advice and Support Centre (ASC) — the first port of call',
        body: 'The ASC answers questions on everything from paying bills and getting transcripts to visas and complaints, and can book you in with Student Services specialist advisers. It is the single best place to start when you are unsure who to contact.',
        sourceUrl: SRC.support,
      },
      {
        category: 'student_services', date: '2026-09-14',
        title: 'Wellbeing & counselling: a “matched care” approach',
        body: 'Student Services runs life and wellbeing advice, counselling and mental health support using a matched care model — your needs are matched to the right support, from one-off chats to ongoing care. The team includes life and wellbeing advisers, counsellors and a mental health coordinator. The disabilities team and financial advice service are also under the same roof.',
        sourceUrl: SRC.support,
      },
      {
        category: 'student_services', date: '2026-09-14',
        title: 'More support: Nightline, StAnd Together peer support, Chaplaincy, and the Union’s advocacy',
        body: 'Beyond Student Services there is Nightline (late-night peer listening line), StAnd Together student peer support, and Chaplaincy. For housing disputes (tenants’ rights) and academic appeals/misconduct, the Students’ Association Advocacy and Advice Service supports you separately from the University.',
        sourceUrl: SRC.support,
      },

      /* ------------------------------- CAREERS ------------------------------ */
      {
        category: 'careers', date: '2026-09-14',
        title: 'Careers Centre: drop-ins, CV & LinkedIn reviews, and 1-to-1 appointments',
        body: 'The Careers Centre (6 St Marys Place) supports every student from Freshers to final year: book drop-ins, CV reviews, LinkedIn reviews, mock interviews and one-to-one appointments online. There is also an “online tools and resources” hub and a new welcome guide for 2026 Freshers.',
        sourceUrl: SRC.careers,
      },
      {
        category: 'careers', date: '2026-09-14',
        title: 'Saint Connect + careers events: meet employers in St Andrews',
        body: 'Saint Connect is the University’s networking platform connecting students with alumni and employers, alongside the Careers Centre events programme (talks, tasters and fairs). Check the events page regularly — employer days are frequent during term.',
        sourceUrl: SRC.careers,
      },
      {
        category: 'careers', date: '2026-09-14',
        title: 'Jobs, internships & the Employability Bursary',
        body: 'The Careers Centre lists live vacancies, explains how to apply effectively (including using AI responsibly), and funds experience: the Employability Bursary and a range of internships. “What can I do with my degree?” and graduate destination data are also published there.',
        sourceUrl: SRC.careers,
      },

      /* ------------------------------ SOCIETIES ----------------------------- */
      {
        category: 'societies', date: '2026-09-14',
        title: '150+ student societies — the full directory is in this app',
        body: 'More than 150 societies are affiliated with the Students’ Association — from Bute Medical and the Union Debating Society (founded 1794) to the Bee Society, The Baking Society and STAMSA. The complete directory (205 societies & networks with official links, emails and signup) is built into SAINT SOCIAL: open the Guide tab → Societies. Membership fees go straight to each society.',
        sourceUrl: SRC.societies,
      },
      {
        category: 'societies', date: '2026-09-18',
        title: 'Societies run every week: The Bop (Fridays) and open nights all year',
        body: 'Societies are the heartbeat of term time. The classic weekly institution is The Bop — the Friday night event at the Union (the SA) — and societies host open nights, competitions and socials through both semesters. Joining is open to all matriculated students, with no limit on how many societies you join.',
        sourceUrl: SRC.union,
      },
      {
        category: 'societies', date: '2026-09-14',
        title: 'No society for it? You can start and affiliate your own',
        body: 'The Students’ Association supports new societies to affiliate — with the Activities Team at the Union (St Mary’s Place) handling the process. “Whether you’re interested in bees, beer, or blockchain, we’ve got something for you” — and if not, they’ll help you build it.',
        sourceUrl: SRC.union,
      },

      /* ------------------------------- SPORTS ------------------------------- */
      {
        category: 'sports', date: '2026-09-18',
        title: 'Men’s Scottish Varsity Match — Friday 18 September 2026, 7:30–10:00pm',
        important: true,
        body: 'St Andrews v Edinburgh in the men’s Scottish Varsity rugby match — believed to be the oldest Varsity match in the world. This season’s fixture is at 7:30pm on Friday 18 September at the university’s Saints Sport facilities. Support the Saints and help bring the trophy home.',
        sourceUrl: SRC.varsity,
      },
      {
        category: 'sports', date: '2026-09-25',
        title: 'Women’s Scottish Varsity Match — Friday 25 September 2026, 7:30pm, free entry',
        body: 'The return of the Women’s Scottish Varsity Match: St Andrews v Edinburgh under the lights on Friday 25 September at 7:30pm, at Saints Sport on St Leonards Road (KY16 9DY). Entry is free — one of the best student nights of the year.',
        sourceUrl: SRC.sport,
      },
      {
        category: 'sports', date: '2026-09-14',
        title: 'Saints Sport: play any sport through BUCS — from rugby (est. 1858) to the 7s tournament',
        body: 'University teams compete weekly in the BUCS leagues and knockouts during term. Highlights: the Rugby Football Club (founded 1858, the sixth-oldest in the world), the St Andrews Rugby 7s tournament (run since 1970, the largest student-run 7s in the UK), and the St Andrews Links Collegiate — elite US & UK college golf played on the Old Course.',
        sourceUrl: SRC.sport,
      },

      /* ------------------------------- NOTICES ------------------------------ */
      {
        category: 'notices', date: '2026-09-21',
        title: 'DEADLINE: final module change for Semester 1 — 1pm Monday 21 September 2026',
        important: true,
        body: 'The final deadline for taught students to change modules in Semester 1 is 1pm on Monday 21 September 2026 (week 2). The Semester 2 deadline is 1pm Monday 1 February 2027. If you have not completed advising, 28 September is the date you will be terminated or have records closed — do it early.',
        sourceUrl: SRC.keyDates,
      },
      {
        category: 'notices', date: '2026-11-27',
        title: 'End of teaching Friday 27 November 2026 — then revision week and the exams diet',
        important: true,
        body: 'Semester 1 teaching ends Friday 27 November 2026. Revision week begins Monday 30 November (graduation ceremonies 1–2 December), and the exams diet runs 5–21 December. Plan your revision schedule around the confirmed timetable published 10 October.',
        sourceUrl: SRC.keyDates,
      },
      {
        category: 'notices', date: '2026-12-22',
        title: 'Christmas vacation starts Tuesday 22 December 2026',
        important: true,
        body: 'Student Christmas holidays start Tuesday 22 December 2026 — the last exams finish the day before. The inter-semester break runs through the weeks of 4, 11 and 18 January, and Candlemas teaching resumes Monday 25 January 2027. Some halls have departure day on 22 December: check yours.',
        sourceUrl: SRC.semesterDates,
      },
      {
        category: 'notices', date: '2027-05-01',
        title: 'May Dip — Saturday 1 May 2027: the traditional dawn cold-water plunge',
        body: 'On the first of May, students in red gowns take to the North Sea at dawn for the May Dip — one of St Andrews’ oldest student traditions (alongside the Sunday Pier Walk and Raisin Monday). Expect cold water, hot chocolate afterwards, and a very early alarm.',
        sourceUrl: SRC.keyDates,
      },
    ];
  }
}

module.exports = UniUpdatesSource;
