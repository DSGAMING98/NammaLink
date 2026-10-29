# Work Checkpoint

Updated: 29 October 2026

## Current phase

Phase 4 — Journey recovery.

## Last completed task

Implemented evidence-aware incident states and an end-to-end simulated missed-connection recovery that preserves completed travel, checks the original contract, and explains when the deadline is no longer feasible.

## Last verified working commit

Interactive journey planner: `2e8296e` on `main`. The recovery milestone is ready for its verified commit.

## Completed features

- Secret-safe local environment configuration from the previous milestone.
- Repository and dataset audit.
- Dataset provenance, licence, record-count, and readiness inventory.
- Architecture decision for a TypeScript schedule-based routing prototype.
- Next.js 16 App Router and strict TypeScript foundation.
- Responsive landing page and Journey Contract concept UI.
- Honest capability-status labels with unit coverage.
- ODbL-attributed 3-route/53-trip BMTC demonstration fixture and reproducible extraction script.
- Calendar-aware scheduled routing with GTFS times beyond 24:00.
- Arrive-by deadline and safety buffer, walking and transfer limits, and direct-only enforcement.
- Fastest, least-waiting, least-walking, direct-preferred, and direct-only ranking.
- Real scheduled central-demo connection test and explicit no-direct-service result.
- Zod-validated journey-planning API with provenance in every response.
- Interactive arrive-by, walking, transfer, and ranking controls.
- Mobile itinerary timeline with route, stop, wait, walk, transfer, and source evidence.
- Disruption scoring with six explicit evidence states; unverified reports cannot invalidate journeys.
- Tested simulated incident overlay that excludes the affected trip without mutating GTFS.
- Recovery preserves the completed leg and produces a next-trip action with an explicit deadline-at-risk warning.

## Incomplete features

Arbitrary place search/maps, full-feed preprocessing/spatial indexing, persistent disruption reporting/moderation, authentication, notifications, ML, low-connectivity, operator insights, and deployment remain incomplete.

## Tests run

- Git branch/status/history inspection: passed.
- Node/npm/pnpm availability: passed.
- `.env.local` variable-presence check with values hidden: passed; all listed variables populated.
- Local dataset readability and file-size inventory: passed.
- Prior dataset row/reference audit: passed for core BMTC/BMRCL GTFS relationships.
- `npm run test:run`: passed, 2 tests.
- `npm run typecheck`: passed.
- `npm run build`: passed; static `/` route generated.
- `npm run data:build`: passed; 3 routes, 216 stops, 53 trips, and 1,343 stop times generated.
- `npm run test:run`: passed, 11 tests across 4 files after the routing milestone.
- `npm run typecheck`: passed after the routing milestone.
- `npm run test:run`: passed, 13 tests across 5 files after API/UI integration.
- `npm run build`: passed with static `/` and dynamic `/api/journeys` routes.
- Browser flow: passed on desktop and 390×844 mobile viewport; central result rendered with no console warning/error.
- `npm run test:run`: passed, 18 tests across 7 files after recovery implementation.
- Recovery browser flow: passed; simulated incident, preserved leg, deadline risk, and next continuation rendered.

## Dataset limitations

- BMTC and BMRCL feeds are unofficial static community feeds.
- No KSRTC dataset.
- No authorized realtime transit feed.
- No labelled historical arrival/delay data.
- BMRCL intermediate times are modelled.
- BMTC coverage and coordinates need outlier handling.
- Some supporting OpenCity files have no stated licence.

## Missing credentials or external blockers

Variables are populated locally. Two minimal Google Places API probes returned HTTP 403, so API enablement, billing, or key restrictions remain a blocker. Supabase schema/access has not been verified. No email, SMS, or web-push provider is configured or required for the core prototype.

## Exact next implementation step

Commit and push the recovery milestone, then implement low-connectivity persistence and queued-report primitives before adding operator schedule insights and final documentation.

## Restore commands

```powershell
Set-Location 'C:\Users\Prajwal\Desktop\Alliance Hackathon\NammaLink'
git status --short --branch
git pull --ff-only origin main
node --version
pnpm --version
```

Read `docs/PROJECT_AUDIT.md`, `docs/IMPLEMENTATION_STATUS.md`, and this checkpoint before continuing.

## Known bugs

No verified runtime bugs in the tested bounded router, central UI, or simulated recovery flow. The recovery API is a deterministic demonstration, not a real incident feed or persistent reporting service.

## Deployment state

Not deployed. The local production build passes; no verified public URL exists.

## Uncommitted work

Disruption/recovery domain engine, simulation API, recovery UI, tests, algorithm/evaluation documentation, and checkpoint updates created in this milestone.

## Evidence supporting claims

- Git history and status from the local checkout.
- Direct local file inspection and record-count analysis.
- Upstream dataset repositories and licence statements linked in the audit and inventory.
- Credential presence reported only as booleans; values were never exposed.

