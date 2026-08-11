# Voyager

A multi-trip travel planner, built from the "Around the world - Travel App"
design (Claude Design handoff, see `../README.md` and `../chats/chat1.md`).
Ships with one real trip preloaded: Rodolfo & Kirsten's Baby Moon in the
Mountains, Aug 21 – Sep 6 2026.

## What's here

- **Trips home** — every trip you and your household have, split into
  Upcoming/Past, plus a "+ New trip" flow with two paths: describe the trip
  in a sentence and let the AI sketch out a title/dates/route/day-by-day
  shape for you to review, or fill it in by hand.
- Per trip: **Trip** dashboard, **Plan** (day-by-day itinerary), **Journey**
  (route map — curated trips only), **Costs**, and **Bookings**.
- Sheets: **Add a cost**, **Add an activity** (with city-aware location
  suggestions on the curated trip, a plain text field otherwise), **Add a
  booking** (flight/stay/ground/car, with an optional route + notes), and
  **booking detail**.
- **Real-time sync across devices**, backed by Supabase (Postgres + Realtime).
  Everyone in your "household" (you + whoever you invite with a code) sees
  the same trips, live — add a cost on your phone, it shows up on Kirsten's
  in seconds. See `supabase/schema.sql` for the full data model.
- Auth is email/password (Supabase Auth). No individual accounts are shared
  with me or anyone else — passwords go straight to Supabase.
- Responsive: a phone-width single column below 720px, a sidebar-nav
  dashboard layout with multi-column screens above it.

## Develop

```sh
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev                  # http://localhost:5173
npm run build                # production build to dist/
npm run lint
```

Without `.env.local` set, the app shows a plain "not connected to a
database" screen instead of crashing — useful for UI-only work.

The AI "describe it" trip flow calls `api/plan-trip.js`, a Vercel
serverless function — it needs an `ANTHROPIC_API_KEY` environment variable
set on the Vercel project (Settings → Environment Variables), not in
`.env.local` (the key is server-only and must never ship to the client).
Without it, "Generate trip" shows an inline error and "or fill it in
yourself" still works.

## Structure

```
supabase/schema.sql        run once in the Supabase SQL editor: tables, RLS, RPCs
api/plan-trip.js           Vercel function: free-text description → trip backbone (Claude API)
src/
  lib/supabaseClient.js    Supabase client (no-ops cleanly if env vars are missing)
  lib/tripMapper.js        maps between the Postgres row shape and the app's trip shape
  data/trip.js             the curated Baby Moon trip's real data (days/bookings/costs)
  data/tripsRegistry.js    babymoonTrip() seed + createEmptyTrip() for new trips
  state/useAuth.js         sign in/up, household create/join, current session
  state/useTripsStore.js   live list of a household's trips, realtime-subscribed
  state/useTripState.js    per-trip UI state (tab/sheet/filters) + derived totals
  utils/dates.js           trip-clock (days until / current day), date range helpers
  utils/dayParts.js        merges seed itinerary text with user-added activities
  components/
    AuthGate.jsx           sign-in / household setup, gates the rest of the app
    TripView.jsx           tab bar + screens + sheets for one open trip
    icons.jsx               inline SVG icon set
    maps/                   schematic route/city maps (SVG, no external map provider)
    screens/                TripsHome, Trip, Plan, Journey, Costs, Bookings
    sheets/                 ExpenseSheet, AddActivitySheet, AddBookingSheet, BookingSheet
  styles/global.css         design tokens (paper-tone palette) + shared component classes
```

## Known gaps

Editing or deleting an existing cost/activity, a real map provider, live FX
rates, and removing a household member are all out of scope for this pass.
