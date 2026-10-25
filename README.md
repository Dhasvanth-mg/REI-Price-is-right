# Rho Price Is Right

A real estate game night for Rho Epsilon Iota. Next.js, TypeScript, Supabase, and Vercel.

## Run locally

Install Node.js 22+, then run `npm install` and `npm run dev`. Open http://localhost:3001.

Host dashboard: `/host`. Default **development-only** password: `rho2026`.
Without Supabase, rooms and uploaded photos are stored in `.local/` on this computer. This mode supports multiple phones on your LAN with one server process. The dev server listens on `0.0.0.0`; open `http://YOUR-WIFI-IP:3001/host` so QR codes use the LAN address. Allow TCP port 3001 through Windows Firewall for your local network. Guest networks with device isolation may prevent phones reaching the laptop.

## Supabase setup

1. Create or choose a Supabase project.
2. Open SQL Editor and run `supabase/migrations/001_game.sql`.
3. In Project Settings → API, copy your project URL, anon/publishable key, and service role/secret key. Only the URL and anon key may be public. Keep the service role key private.
4. Copy `.env.example` to `.env.local`; fill in those three Supabase settings. Set `ADMIN_PASSWORD` and a random 32+ character `SESSION_SECRET`. Restart the dev server.

Run `npm run seed` after the migration to persist the ten-property catalog in Supabase. The SQL migration creates the Storage bucket and enables revision notifications through Realtime. The catalog editor supports photo upload and image ordering. The collection includes 44 actual listing photos, with sources in `public/listings/SOURCES.md`. The image manifest and local copies are committed so phones do not depend on listing-site requests during play. Unknown listing details stay unknown; island acreage is not presented as interior floor area. Prices are user-supplied snapshots and are never automatically refreshed. Pittsburgh and Philadelphia bedroom/bathroom counts have been verified against their listing pages.

## Vercel setup

1. Push this source to your GitHub repository.
2. In Vercel, Add New → Project → import `REI-Price-is-right`.
3. Keep the detected Next.js defaults and add all five variables from `.env.example`: `ADMIN_PASSWORD`, `SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy. Sign in at `/host`, create a room, open the projector, and scan the QR with a second device.

Do not set `ALLOW_LOCAL_STORAGE` on Vercel. The application deliberately refuses local storage on Vercel because function filesystems are not persistent/shared. There is no production fallback password. Admin credentials are configured through Vercel environment settings.

## Game flow

Create room → lobby → introduction → open guessing → lock → reveal → leaderboard → next property → final podium. Every reveal shows round results and the cumulative leaderboard to players. The host controls progression. Players submit and edit guesses until the server deadline, and reconnect using an HTTP-only cookie. For team play, first member is captain; others discuss. Removing the captain promotes the next active teammate.

Settings include session duration, round duration, number of properties, scoring tiers, exact bonus, final multiplier, team mode, name filtering, closest without going over, reasoning, and optional point wagers. Browser-saved defaults apply to new rooms. Room snapshots preserve existing games when the catalog changes. Player management supports rename, emoji replacement, removal, and manual challenge bonus points. Host CSV exports escape spreadsheet formula prefixes.

## Persistence and access

For this small-event version, each game is a private JSON document in PostgreSQL, updated using an atomic revision compare-and-swap function. This is intentionally a simpler schema than the normalized-table proposal in the supplied brief. Concurrent writes retry against the newest revision. Host controls require an expected revision and idempotency key. Guess authorization, deadlines, scoring, and answer redaction run on the server. No private state tables are readable through the anonymous Supabase client. Only room-code/revision notifications are published; clients retrieve a separately redacted API view. Realtime has polling and reconnect fallbacks.

Host authentication uses a shared event admin password and signed HTTP-only cookies, rather than Supabase Auth accounts. Any browser signed in with that password can administer an existing room, including rooms created on another computer or before this update. Open `/host/[roomCode]` directly or enter the code under "Open the same room here" on the host dashboard. The room's copy-admin-link button provides the direct URL; that URL still requires the host password. Both admin screens receive live updates. Atomic control revisions prevent simultaneous commands from advancing twice; a stale admin is prompted to retry. The creator session ID is retained as provenance, not an access restriction. Player and projector responses continue to hide answers before reveal, and unauthenticated users cannot control games or export results. Common-profanity filtering is deliberately basic; host moderation is the final control.

Session expiration is enforced on every read/write and ends the game. Guess deadlines are checked atomically on submission; clients display their countdown using a server-clock offset. The visible phase settles on the next API refresh, not a background scheduler. Production load for 100 simultaneous users has not been benchmarked.

## Checks

```
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The Playwright test uses installed Microsoft Edge on Windows. It creates a host and two isolated player contexts, submits guesses, checks answer privacy, reloads a player, reveals scores, and advances. Use Chromium instead by updating the Playwright project if Edge is unavailable.

## Routes

`/` landing · `/join` room code · `/play/[code]` participant · `/host` dashboard · `/host/[code]` controls · `/display/[code]` projector · `/results/[code]` current/final scores · `/admin/properties` catalog · `/admin/settings` defaults.
