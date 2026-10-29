# Work Checkpoint

Updated: 29 October 2026

## Current phase

Phase 2 — Core route optimization.

## Last completed task

Generated a reproducible bounded BMTC fixture and implemented the tested schedule router, arrive-by search, hard Journey Contract constraints, Pareto filtering, and central Jain–Banashankari–Alliance-area integration proof.

## Last verified working commit

Application foundation: `05e00df` on `main`. The data-and-routing milestone is ready for its verified commit.

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

## Incomplete features

Full-feed preprocessing/spatial indexing, interactive journey planning, recovery, authentication, notification, ML, low-connectivity, operator-insight, and deployment remain incomplete.

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

Commit and push the data-and-routing milestone, then expose the router through a validated API and connect the landing page to an interactive Journey Contract/results flow.

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

No verified runtime bugs in the tested bounded router. Full-feed request-time enumeration is intentionally unsupported; the diagnostic cap protects the prototype from runaway searches.

## Deployment state

Not deployed. The local production build passes; no verified public URL exists.

## Uncommitted work

Fixture generator, bounded dataset, transit domain/router/tests, algorithm documentation, and checkpoint updates created in this milestone.

## Evidence supporting claims

- Git history and status from the local checkout.
- Direct local file inspection and record-count analysis.
- Upstream dataset repositories and licence statements linked in the audit and inventory.
- Credential presence reported only as booleans; values were never exposed.

