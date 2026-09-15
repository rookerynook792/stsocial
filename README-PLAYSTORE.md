# SAINT SOCIAL → Google Play Store — everything you need

**What's built for you (in this repo):**

| Item | Where | Notes |
|---|---|---|
| **Signed release AAB** (for Play upload) | `android/app/build/outputs/bundle/release/app-release.aab` | Built, signed, ready to upload |
| **Signed release APK** (for your own phone / testing) | `android/app/build/outputs/apk/release/app-release.apk` | Sideloadable — copy to a phone, install, test |
| Play store icon (512×512) | `play-assets/icon-512.png` | Upload in Play Console |
| App icon (1024×1024) | `play-assets/icon-1024.png` | Keep as master |
| Maskable icon | `play-assets/icon-maskable-512.png` | Optional extra |
| Feature graphic (1024×500) | `play-assets/feature-graphic-1024x500.png` | Upload in Play Console |
| Phone screenshots (1080×1920) | `play-assets/screenshots/*.png` | Upload 2–8; minimum 1 |
| Privacy policy (LIVE) | https://stsocial.onrender.com/privacy | Put this URL in the listing — Play requires it |
| **Signing keystore** | `keystore/saint-social.keystore` | ⚠️ **BACK THIS FILE UP.** You need it + its password for every future update. |
| Keystore password | `keystore/keystore.properties` | alias `saintsocial`. Never share, never commit. |

> The app inside the AAB talks to the live backend at **https://stsocial.onrender.com** (Render free plan).
> No extra setup needed — it works as soon as the backend is up.

---

## Step 1 — Create your Play Console account (one time)

1. Go to https://play.google.com/console and sign in with your Google account.
2. Pay the **one-time $25** developer registration fee (card). You can register as an **individual** (your name shows as publisher) — no business account needed.
3. Accept the developer distribution agreement.
4. Google reviews the account — usually same day, sometimes up to 48h.

## Step 2 — Create the app & fill in the listing

1. Play Console → **Create app** → Name: `SAINT SOCIAL`, default language: English (UK), type: **App**, country: all.
2. **Store presence** tab → paste the copy below and upload the assets:
   - **App icon:** `play-assets/icon-512.png`
   - **Feature graphic:** `play-assets/feature-graphic-1024x500.png`
   - **Phone screenshots:** all files in `play-assets/screenshots/` (1080×1920, upload at least 2, ideally 4–5)

### Short description (max 80 chars)
```
The St Andrews student app — real events, guide, societies & uni updates.
```

### Full description (max 4000 chars)
```
SAINT SOCIAL is the go-to app for student life in St Andrews. It puts the whole town — what's on, where to go, who to join and what the university is doing — in one fast, beautiful place.

WHAT'S INSIDE

📅 EVENTS
Real, verified events around the town and campus — nightlife, music, sport, arts, food, charity, outdoors, academic and careers — with dates, times, venues and links. No invented "coming soon" filler.

📖 THE GUIDE
A deep-dive guide to St Andrews: the Old Course, the beaches, St Salvator's, the castle, the old town, pubs, eateries and everything in between. Every tap opens rich detail — history, fun facts and practical info.

🎓 SOCIETIES
All 200+ societies and networks from the Students' Association, searchable by interest, each linking to the official union page with contact details and how to join.

🏛 UNIVERSITY
Live university news (straight from the official feed) plus verified updates in every category: academic dates, exams, accommodation, student services, careers, societies, sport and notices — including the key 2026–27 dates.

📷 GALLERY
Royalty-free photography of the town with proper credit to every photographer.

🗺 MAP & WEATHER
Google Maps of the town centre and a live daily weather forecast, so you always know what to wear.

COMMUNITY
Create a profile, post what's happening, follow people and get notified. Sign in with your University of St Andrews email to earn the verified student badge.

Built for students, by people who know the town. No ads, no trackers — just the best of St Andrews.
```

### App website
`https://stsocial.onrender.com`

### Privacy policy URL
`https://stsocial.onrender.com/privacy`

## Step 3 — App content (Data safety form)

Answer the **Data safety** questions like this (match the privacy policy):

| Question | Answer |
|---|---|
| Do you collect or disclose any user data? | **I do not collect or disclose any data** (the app backend stores accounts, but the *Android app itself* collects nothing — it's a webview pointed at the site; if Play requires honesty about server-side storage, select "I collect data" → **User provided info: name, email address, other info** as "Collected", purpose "Account management", not shared with third parties, deletable on request) |
| Do you confirm the app is not directed at children under 13? | **Yes** |
| Any ads? | **No** |

Tip: the safest form that matches the privacy policy is "I collect data → user-provided (name, email) → purpose: account management → not shared → can be deleted". The app is a wrapper around the website, and the site stores accounts, so being explicit is fine and keeps you compliant.

## Step 4 — Content rating

- **Target audience:** 12+ (the store will likely suggest this).
- Category: **Social** (or Lifestyle).
- In-app purchases: **None**.
- Ads: **None**.

## Step 5 — Testing & release

1. **Testers:** add a few student email addresses to the **Closed testing** track and send them the URL they get — have them install the APK/AAB or use the link. This also satisfies Play's "at least 1 tester" for some flows.
2. **Production:** upload the **AAB** (`app-release.aab`), hit **Review**, then **Roll out to production** (start at 20% and expand after 24h if you like, or 100% immediately).
3. First review takes **1–7 days** (often under 48h).

## Step 6 — Future updates (important!)

1. Update the web app here, `git push` (Render auto-deploys).
2. Rebuild the AAB:
   ```
   cd stsocial
   npx cap sync android
   cd android
   JAVA_HOME=/home/user/jdk21 ANDROID_HOME=/home/user/android-sdk ./gradlew bundleRelease -x lint
   ```
   (on a machine with the Android SDK; the AAB output is in `app/build/outputs/bundle/release/`)
3. Bump `versionCode` in `android/app/build.gradle` (currently 1 → 2 → 3…) — it MUST go up by 1 each release.
4. Upload the new AAB in Play Console → new release. **Sign with the same keystore** — if you lose `keystore/saint-social.keystore`, you can never update the app.

---

## Account & server credentials (keep safe)

- **Backend:** Render free plan, service `stsocial` (auto-deploys from GitHub `rookerynook792/stsocial` → main)
- **Live app:** https://stsocial.onrender.com
- **Admin login:** admin@stsocial.app / stsocial-admin
- **Signing keystore:** `keystore/saint-social.keystore`, alias `saintsocial`, password in `keystore/keystore.properties`
- **App ID:** `app.stsocial.standrews` · **App name:** SAINT SOCIAL · **versionName 1.0**

## What the reviewer will see

The app opens straight into the live feed (events + weather + university updates). No demo mode, no fake data — everything on screen comes from the real backend: official university feeds, verified local events, the Students' Association society directory, real venues and a real weather API.
