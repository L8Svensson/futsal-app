# AGENTS.md

## What this is

A small Node + React + Vite + TypeScript + Tailwind CSS app for managing weekly
futsal match call-ups (squad selection per match), modeled directly on the
real-world spreadsheet `Futsal_9_Player_Updated.xlsx` (sheets: `Matchkallelser`
= weekly match call-ups, `Summary` = per-player call-up counts).

Data model (`src/types.ts`):
- `Player`: `{ id, name }`
- `MatchInfo`: day/date/time, home/away team, venue (+ optional alt venue),
  `squad` (player ids called up), `coaches`.
- `Week`: `{ id, label, matches: MatchInfo[] }` — up to 2 matches per week.
- `AppData`: `{ players: Player[], weeks: Week[] }`

## Stack

- React 19 + TypeScript, built with Vite.
- Tailwind CSS v4 via the `@tailwindcss/vite` plugin (no `tailwind.config.js`
  needed — configuration lives in `src/index.css` via `@import "tailwindcss"`).
- `xlsx` (SheetJS) for both the one-off seed generation script and in-app
  Excel import/export.
- `@supabase/supabase-js` — shared data store, gated behind a real login. A
  single Postgres row (`app_state`, id=1) holds the entire `AppData` as
  `jsonb`. Row Level Security only allows `select`/`update` for the
  `authenticated` Postgres role, so the data is invisible to anyone who
  hasn't signed in. Everyone uses one shared Supabase Auth account (fixed
  email + shared password) to sign in. Supabase Realtime pushes updates to
  every signed-in open tab. There is no custom backend server — the static
  frontend talks to Supabase directly.

## Project layout

```
src/
  types.ts                    Core data model
  data/seedData.ts            Generated from the real Excel file (see below) — do not hand-edit
  utils/matchkallelserParser.ts   Pure row <-> AppData conversion (parse + serialize + summary)
  utils/excelIO.ts            Browser import/export using the SheetJS `xlsx` package
  lib/supabaseClient.ts       Supabase client, built from VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
  store/AppStore.tsx          React context: loads/subscribes to Supabase, exposes CRUD actions
  components/                 PlayerManager, WeekList, MatchEditor, SummaryTable, ImportExportBar, LoginGate
supabase/schema.sql           SQL to run once in the Supabase SQL editor for a fresh project (table, RLS)
supabase/migration-login.sql  One-time migration for a project previously set up with the old password-RPC model
scripts/generateSeed.ts       One-off script that re-parses the real .xlsx into src/data/seedData.ts
.github/workflows/deploy.yml  Builds and deploys dist/ to GitHub Pages on push to main
```

## Regenerating seed data

If the source spreadsheet changes, regenerate `src/data/seedData.ts`:

```sh
npx tsx scripts/generateSeed.ts
```

This reads `C:\Lotta\Fotboll\Futsal_9_Player_Updated.xlsx` directly (hardcoded
path in the script) and overwrites `src/data/seedData.ts`. The row-parsing
logic is shared (`src/utils/matchkallelserParser.ts`) with the in-app "Import
Excel" feature, so both stay in sync.

## Shared Supabase backend setup (one-time)

1. Create a free project at https://supabase.com.
2. In the SQL editor, run `supabase/schema.sql` (creates `app_state` and its
   login-gated RLS policies).
3. In **Authentication > Users > Add user**, create the one shared login
   (email + password), ticking **"Auto Confirm User"** so it works without an
   email round-trip. Everyone who needs access uses this same login.
4. In **Database > Replication**, enable Realtime for the `app_state` table.
5. In **Project Settings > API**, copy the Project URL and `anon` public key.
6. Local dev: copy `.env.example` to `.env.local` and fill in those two values.
7. Deployment: add them as **GitHub repo secrets** named
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Settings > Secrets and
   variables > Actions) — the `deploy.yml` workflow reads them at build time.

Nobody can view or edit data without first signing in with the shared login
— this is enforced at the database level via RLS (`for ... to authenticated`
policies), not just a client-side screen, so the data isn't reachable via the
API either without a valid session.

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In the repo, go to **Settings > Pages** and set Source to "GitHub Actions".
3. Add the two repo secrets from step 6 above.
4. Push to `main` (or run the workflow manually) — `.github/workflows/deploy.yml`
   builds with `BASE_PATH=/<repo-name>/` and publishes `dist/` to Pages.

## Build & run

```sh
npm install
npm run dev      # dev server
npm run build    # tsc -b && vite build
npm run lint     # oxlint
npm run preview  # preview the production build
```

There are no automated tests yet. When adding logic to
`matchkallelserParser.ts` (parsing/serialization), prefer adding test cases
there since it's pure and easy to verify against the real spreadsheet's
`Summary` sheet counts.

## Conventions

- Keep `matchkallelserParser.ts` pure (no DOM/Node-specific APIs) since it's
  shared between the Node seed script and the browser import feature.
- Player references in `MatchInfo.squad` are player **ids**, not names, so
  renaming a player doesn't break historical call-ups.
- `AppStore.tsx` is the single source of truth for mutations; components
  should call its actions rather than talking to Supabase directly. Writes
  are optimistic (applied locally, then sent to Supabase) and roll back with
  a `window.alert` if the server rejects them (e.g. the session expired).
