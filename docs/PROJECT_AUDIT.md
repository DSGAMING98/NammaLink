# NammaLink Project Audit

Audit date: 29 October 2026 (Asia/Calcutta)

## Repository baseline

| Item | Verified state |
| --- | --- |
| Repository | `https://github.com/DSGAMING98/NammaLink` |
| Branch | `main`, tracking `origin/main` |
| Starting commit | `14974140db9285fb9740a7486883d6de7819a28e` |
| Working tree before audit | Clean |
| Application framework | Not present |
| Source code | Not present |
| Package manifest / lockfile | Not present |
| Tests / CI / deployment | Not present |
| Existing tracked files | `README.md`, `.env.example`, `.gitignore` |
| Development runtime | Node.js 25.9.0, npm 11.21.0, pnpm 11.25.0 |
| Free disk at audit | Approximately 120.6 GiB |

The repository was a documentation-only planning project. There was no existing implementation to reuse or migrate.

## Configuration audit

`.env.local` exists and is ignored by Git. The following variables are populated locally; values were neither printed nor copied:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`
- `GOOGLE_ROUTES_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `GOOGLE_GEOCODING_API_KEY`
- `OVERPASS_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Presence does not prove that a credential is valid, correctly restricted, enabled for billing, or authorized for a particular API. Live Google and Supabase access remains unverified at this checkpoint. API checks must report only status and non-sensitive metadata.

## Local transport data

The workspace contains current-looking community BMTC and BMRCL GTFS snapshots, historical BMRCL ridership workbooks, and supporting CSV/KML files. No KSRTC dataset was found.

### BMTC GTFS

Path: `../bmtc/`

- 12 files, 204,344,405 bytes.
- Feed version `20260907`, calendar validity `2026-09-07` through `2027-09-07`.
- 4,434 routes, 9,960 stops, 57,836 trips, 1,540,686 stop times, and 2,492,304 shape points.
- Core trip/route/shape and stop-time/trip/stop references resolved in the audit.
- No `calendar_dates.txt`, `transfers.txt`, `frequencies.txt`, GTFS-Realtime feed, or verified accessibility data was found.
- Spatial coordinates extend well beyond Bengaluru and require outlier checks.

Provenance: [Vonter/bmtc-gtfs](https://github.com/Vonter/bmtc-gtfs), an unofficial community feed derived from the Namma BMTC app. The upstream repository publishes the database under ODbL 1.0 and notes underlying BMTC rights. Upstream warns that schedules can be inaccurate and routes without functional live tracking may be absent.

Readiness: suitable for schedule-based prototype routing and network analysis after normalization and validation; not suitable for claims of authoritative live service.

### BMRCL GTFS

Path: `../bmrcl/`

- 22 files, 7,540,025 bytes.
- Feed version `20260817`, validity `2026-08-17` through `2027-08-17`.
- 3 routes, 488 stop/station/platform/entrance records, 3,279 trips, 88,906 stop times, and 4,541 shape points.
- Includes calendar exceptions, transfers, pathways, levels, translations, and GTFS Fares v2 tables.
- Core references resolved in the audit.

Provenance: [Vonter/bmrcl-gtfs](https://github.com/Vonter/bmrcl-gtfs), an unofficial community feed built from BMRCL timetable images and OpenStreetMap spatial data, published under ODbL 1.0. Intermediate station times are synthesized from distance, speed, and dwell assumptions; short-loop service can be incomplete.

Readiness: suitable for schedule-based prototype routing, transfer/pathway experiments, and validation; not authoritative minute-level live data.

### Historical ridership

| File | Verified coverage | Readiness |
| --- | --- | --- |
| `../hourly sept 2025.xlsx` | Entry and exit sheets; 2,490 station-day rows each; 83 stations for 30 days; hourly totals reconcile | Demand analysis and operator-insight demonstrations, not live occupancy |
| `../Station-wise Hourly Data - August 2025.xlsx` | 1,355 station-day rows; 83 unique stations; 1–18 August 2025; daily station coverage varies | Historical demand analysis with explicit coverage handling |
| `../Station-wise Hourly Data - August 20250.xlsx` | 27,516 station-pair rows; 83 station-code columns; 374 date-hour groups; 1,305 aggregate/control rows with blank station | Origin-destination analysis after station-code mapping and row-type parsing |

Provenance: BMRCL data obtained through RTI and republished in [Vonter/bmrcl-ridership-hourly](https://github.com/Vonter/bmrcl-ridership-hourly) under ODbL 1.0 with underlying BMRCL rights noted.

No labelled historical observed arrival or delay dataset was found. Supervised delay-model training is therefore not currently valid. The first ETA implementation must use a schedule-only baseline and label it accordingly.

### Other local files

- Majestic platform CSV: 427 rows; OpenCity resource lists no licence. Use for local validation only pending permission review.
- Majestic platform KML: 57 line-string placemarks; OpenCity lists no licence.
- Bengaluru railway/metro KML: 597 line-string placemarks; OpenCity lists CC Attribution with credit to Nishanth C.
- Legacy BMTC coordinate bundle: incomplete and unverified provenance; only 119 of 4,271 route rows contain coordinates. Do not integrate into production routing.

Full details are maintained in [DATASET_INVENTORY.md](DATASET_INVENTORY.md).

## Central demonstration coverage

The BMTC feed contains `Jain University Gate` stops and an express route between Jain University Gate and Banashankari. It also contains multiple Anekal routes. This does not yet prove a valid through-journey to Alliance University. Exact campus coordinates, walking access, service calendars, stop sequence, and transfer feasibility must be resolved by the router. The illustrative options in the specification remain unverified until that search completes.

## Initial architecture decision

Build a single Next.js TypeScript application with:

1. A pure TypeScript transit-domain and routing library.
2. Reproducible scripts that ingest local GTFS into compact generated artifacts kept out of Git unless intentionally bounded.
3. A small committed, source-attributed demonstration artifact for browser and CI tests.
4. API routes for routing, dataset health, and disruption simulation.
5. A mobile-first UI that works with schedule data even when Google APIs fail.

Use a connection-scan-style timetable engine first because it is easier to make correct and test within the hackathon window. Add reverse arrive-by search and Pareto filtering before considering more complex RAPTOR variants.

## Risks and blockers

- Google API validity, billing state, quotas, and Bengaluru transit coverage are not yet verified.
- No authorized realtime vehicle, trip-update, service-alert, occupancy, or lift-status feed is present.
- No KSRTC data is available.
- No labelled arrival-delay data is available for supervised ML.
- Exact central-demo campus coordinates and last-mile walking paths need verification.
- Dataset licences prevent blindly committing raw copies.

## Phase 0 completion criteria

- [x] Repository, branch, history, and working tree inspected.
- [x] Runtime and disk capacity inspected.
- [x] Local environment-variable presence checked without exposing values.
- [x] Relevant local transport datasets inventoried.
- [x] Provenance, licence, and implementation readiness recorded.
- [x] Existing functionality and reusable code assessed.
- [x] Initial architecture and honest blockers recorded.

