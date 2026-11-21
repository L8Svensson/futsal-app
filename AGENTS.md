# AGENTS.md

## What this is

A small Node + React + Vite + TypeScript + Tailwind CSS app for managing weekly
futsal match call-ups (squad selection per match), modeled directly on the
real-world spreadsheet `Futsal_9_Player_Updated.xlsx` (sheets: `Matchkallelser`
= weekly match call-ups, `Summary` = per-player call-up counts).

Data model (`src/types.ts`):
- `Player`: `{ id, name }`
- `MatchInfo`: day/date/time, home/away team, venue (+ optional alt venue),
  `squad` (player ids called up), optional `altSquad` (reserves), `coaches`.
- `Week`: `{ id, label, matches: MatchInfo[] }` — up to 2 matches per week.
- `AppData`: `{ players: Player[], weeks: Week[] }`

## Stack

- React 19 + TypeScript, built with Vite.
- Tailwind CSS v4 via the `@tailwindcss/vite` plugin (no `tailwind.config.js`
  needed — configuration lives in `src/index.css` via `@import "tailwindcss"`).
- `xlsx` (SheetJS) for both the one-off seed generation script and in-app
  Excel import/export.
- State persists to `localStorage` only — there is no backend/API.

## Project layout

```
src/
  types.ts                    Core data model
  data/seedData.ts            Generated from the real Excel file (see below) — do not hand-edit
  utils/matchkallelserParser.ts   Pure row <-> AppData conversion (parse + serialize + summary)
  utils/excelIO.ts            Browser import/export using the SheetJS `xlsx` package
  store/AppStore.tsx          React context + localStorage-backed CRUD actions
  hooks/useLocalStorageState.ts
  components/                 PlayerManager, WeekList, MatchEditor, SummaryTable, ImportExportBar
scripts/generateSeed.ts       One-off script that re-parses the real .xlsx into src/data/seedData.ts
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
- Player references in `MatchInfo.squad` / `altSquad` are player **ids**, not
  names, so renaming a player doesn't break historical call-ups.
- `AppStore.tsx` is the single source of truth for mutations; components
  should not write to `localStorage` directly.
