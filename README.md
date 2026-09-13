# 🌊 ST SOCIAL

A modern, mobile-first **student social + events app** for the University of St Andrews, Fife, Scotland.
One place to see **what's happening on campus and around town right now**, plus a student community forum.

> ⚠️ **DEMO DATA** — Until live sources are connected, all events/updates are realistic sample content,
> clearly labelled **DEMO DATA**. The ingestion architecture is built so real university / society / venue
> feeds and APIs can be connected later (see *Sources* below). No real events are invented.

---

## ✨ What it does

- **Home** — answers *"What's happening in St Andrews right now?"* (happening now / today / trending / town / university / forum).
- **Events** — every event auto-**aggregated from pluggable sources**, **auto-categorised** (12 categories), **de-duplicated & merged** (keeps the most reliable source), and marked **University Verified / Verified / Imported / Community** + **DEMO**.
- **Event detail** — interested/going, tickets, share, report.
- **Forum** — posts, upvotes, comments, replies, save, follow, report.
- **Town** — town updates, what's-on, local places + reviews, and an **interactive map**.
- **University** — official updates, clearly **University Verified**.
- **Profiles** — public / students-only / private, verified-student badge, saved posts & events.
- **Global search**, **notifications + preferences**, **dark mode**.
- **Admin dashboard** — moderation queue, event approval, sources, analytics, users, updates management.
- **Student verification** via university email domain; **RBAC** (student / admin).

## 🧱 Tech stack

Node 20 · **Express 5** · **better-sqlite3** (zero-config, file-based) · **vanilla-JS ES-module SPA** (no build step).
Everything is served from **one port** (API + static SPA), so it works through any reverse proxy.

## 🚀 Run it locally

```bash
npm install
npm start            # seeds demo data on first boot, starts on :3000
# or
npm run dev          # same, foreground
npm run seed --reset # wipe + reseed the database
```

Open **http://localhost:3000**.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| 🛡️ Admin | `admin@stsocial.app` | `stsocial-admin` |
| 🎓 Student (verified ✓) | `rileyf@st-andrews.ac.uk` | `stsocial123` |
| 🎓 Student (verified ✓) | `amara.o@st-andrews.ac.uk` | `stsocial123` |

The sign-in screen has one-tap **demo** buttons.

## ⚙️ Configuration (environment variables)

Copy `.env.example` → `.env`. The frontend never sees any of these.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `AUTH_SECRET` | dev fallback | Signs session tokens (set a long random string in prod) |
| `INGEST_API_KEY` | dev fallback | Key required by `/api/ingest/*` for approved external systems |
| `VERIFIED_EMAIL_DOMAINS` | `st-andrews.ac.uk,…` | Email domains that auto-verify the student badge |
| `STSSOCIAL_DEMO_MODE` | `true` | Serve clearly-labelled DEMO DATA |
| `STSSOCIAL_LIVE_SOURCES` | `false` | When `true`, adapters attempt real fetches |
| `INGEST_INTERVAL_MS` | `300000` | How often the ingestion pipeline re-runs (5 min) |
| `DATA_DIR` | `./data` | Where the SQLite DB + uploads live |

## 🔌 Connecting real sources (the extensible bit)

Sources live in `server/aggregation/sources.js` (the registry) and each source type has an **adapter** in
`server/aggregation/adapters/`. The pipeline (`pipeline.js`) **fetch → categorise → de-duplicate → merge → upsert**,
so adding a source never creates duplicates and never requires rewriting the app.

Two ways to add a feed:

1. **In-app (admin → Sources)** — add a public source (RSS/Atom feed, university calendar, venue API…).
   A real, tolerant **RSS/Atom parser** is included.
2. **API push** — approved systems `POST /api/ingest/events` with the `INGEST_API_KEY` header:

```bash
curl -X POST https://your-app/api/ingest/events \
  -H "Content-Type: application/json" -H "X-Ingest-Key: $INGEST_API_KEY" \
  -d '{"source":{"name":"SA Events","type":"society","reliability":9},
       "events":[{"title":"SA Club Night","date":"2026-09-20","startTime":"20:00","location":"The SA","category":"nightlife"}]}'
```

Pushed items go through the **same** categorise + de-duplicate + merge pipeline as scheduled sources.

## ☁️ Deploy to a free server

The app is a single Node service on one port — it deploys anywhere. It ships with a **Dockerfile**, **Procfile** and **render.yaml**.

### Render (recommended, free web service)
1. Push this folder to a GitHub repo.
2. Render → **New → Web Service** → pick the repo. Render reads `render.yaml` automatically (or set:
   build `npm install`, start `node server/index.js`, health check `/api/health`).
3. Set `AUTH_SECRET` and `INGEST_API_KEY` as environment values.
4. Deploy → you get a public `https://…render.app` link.
> **Note:** Render's free web tier has an ephemeral filesystem. SQLite data will reset on each deploy.
> For persistence, attach a **Render Disk**, mount it at `/data`, and set `DATA_DIR=/data`. (Demo data re-seeds automatically, so it works either way.)

### Fly.io / Railway
Works with the included **Dockerfile**. Attach a volume for `/app/data` (or `/data` with `DATA_DIR`) for persistence.

### Any VPS (Hetzner / DigitalOcean / free tiers)
```bash
git clone <your-repo> && cd stsocial
npm install --omit=dev
AUTH_SECRET=$(openssl rand -hex 32) INGEST_API_KEY=$(openssl rand -hex 16) node server/index.js
# run under pm2 / systemd to keep it alive; put it behind Caddy/Nginx + a domain + Let's Encrypt
```

## 🗂️ Project layout

```
server/
  index.js          entry point (seed → scheduler → listen)
  app.js            Express app (API + static SPA + SPA fallback + uploads)
  db.js             schema + migrations (better-sqlite3, WAL)
  auth.js           scrypt hashing, sessions, RBAC, email verification
  notify.js         notification helper (pref-gated)
  util.js           hashing, dates, categories, post types
  config.js         env config
  seed.js           demo community data (idempotent)
  aggregation/      the extensible ingestion engine
    sources.js      pluggable source registry
    pipeline.js     fetch → categorise → dedupe → merge → upsert
    scheduler.js    scheduled + boot ingestion, "always alive" demo ticker
    categorize.js   keyword-based auto-categorisation
    dedupe.js       normalise / fuzzy de-duplication
    adapters/       one adapter per source type (university, SA, venue, RSS, …)
  routes/           auth, events, forum, town, university, home, search,
                    notifications, profile, admin, ingest
public/             the zero-build SPA (index.html + css + js ES modules)
```

## 📄 Note on data & privacy
No sensitive personal info is collected beyond what's needed to create a profile. Privacy is
**public / students-only / private**. Student verification is by university email domain and is designed
to be extended. DEMO DATA is synthetic and clearly labelled.
