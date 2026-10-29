# Dataset Inventory

Last updated: 29 October 2026

Raw data lives outside the repository. Reproducible generated artifacts will be stored under ignored `data/generated/` unless a small, licensed demo fixture is intentionally committed.

| Dataset | Local path | Source | Licence / status | Records and coverage | Intended use | Key limitations |
| --- | --- | --- | --- | --- | --- | --- |
| BMTC static GTFS | `../bmtc/` | [Vonter/bmtc-gtfs](https://github.com/Vonter/bmtc-gtfs) | ODbL 1.0 community feed; underlying BMTC rights noted | 4,434 routes; 9,960 stops; 57,836 trips; 1,540,686 stop times; valid 2026-09-07–2027-09-07 | Schedule routing, nearby stops, route geometry, fares | Unofficial; known schedule gaps; no realtime; coordinate outliers; no explicit transfers or exceptions |
| BMRCL static GTFS | `../bmrcl/` | [Vonter/bmrcl-gtfs](https://github.com/Vonter/bmrcl-gtfs) | ODbL 1.0 community feed derived from BMRCL and OSM | 3 routes; 488 stop/location records; 3,279 trips; 88,906 stop times; valid 2026-08-17–2027-08-17 | Metro routing, station pathways, transfers, fares | Intermediate times synthesized; short-loop service may be incomplete; no realtime |
| September 2025 metro hourly entries/exits | `../hourly sept 2025.xlsx` | BMRCL RTI via [Vonter](https://github.com/Vonter/bmrcl-ridership-hourly) | ODbL 1.0 republication; underlying BMRCL rights | 4,980 station-day-direction rows over 30 days and 83 stations | Demand profile and operator dashboard | Historical counts, not capacity or live occupancy |
| August 2025 metro station hourly entries | `../Station-wise Hourly Data - August 2025.xlsx` | BMRCL RTI / OpenCity / Vonter | ODbL 1.0 republication | 1,355 rows, 18 days, 83 unique stations | Demand analysis | Daily station coverage varies from 68 to 83 |
| August 2025 metro station-pair hourly matrix | `../Station-wise Hourly Data - August 20250.xlsx` | BMRCL RTI / OpenCity / Vonter | ODbL 1.0 republication | 27,516 rows, 83 destination columns, 374 date-hour groups | OD demand experiments | Requires station-code map; aggregate rows need explicit handling |
| Majestic platform routes | `../BMTC Majestic Bus Stand Platform Routes.csv` | [OpenCity](https://data.opencity.in/dataset/bengaluru-public-transport-infrastructure) | No licence provided | 427 platform-route assignments | Transfer guidance validation | Freshness unknown; do not redistribute pending permission review |
| Majestic platform geometry | `../BMTC Majestic Bus Stand Platform Map.kml` | OpenCity | No licence provided | 57 line strings | Map context | Not a pedestrian/accessibility network |
| Bengaluru metro and railway geometry | `../Metro and Railways Lines Map of Bengaluru.kml` | [OpenCity](https://data.opencity.in/dataset/bengaluru-railway-and-metro-lines-map) | CC Attribution; credit Nishanth C | 597 line strings | Background cross-checking | No schedules or service state |
| Legacy BMTC CSV bundle | `../BMTC Route with coordinates.zip` | Unverified | Unknown | 4,271 routes; 4,433 stops; 15,170 trips; 15,017 stop times | Comparison only | 97.2% route coordinate rows blank; incomplete GTFS; no source/licence metadata |
| KSRTC | Not found | Not applicable | Not applicable | None | Future regional/intercity routing | Missing; must not infer KSRTC service from BMTC data |
| Historical observed arrivals/delays | Not found | Not applicable | Not applicable | None | Delay modelling | Blocks supervised ML validation; use schedule baseline |
| Authorized realtime transit | Not found | Not applicable | Not applicable | None | Live ETA and disruptions | Do not label scheduled or simulated data as live |

## Download and refresh policy

Before accepting a new dataset:

1. Record source URL, publisher, retrieval date, upstream version, licence, checksum, size, and expected tables.
2. Check for duplicates against the existing feed versions and checksums.
3. Validate schema, keys, geographic bounds, service dates, and cross-table references.
4. Keep raw downloads and caches outside Git.
5. Commit only scripts, manifests, validation summaries, and intentionally small licensed fixtures.
6. Reject sources that require bypassing access controls, contain private data, or have unclear redistribution terms for the intended use.

## Current discovery decision

No additional large download is justified before the existing BMTC and BMRCL feeds are normalized and routed. Priority gaps are an authorized realtime source, KSRTC data, and labelled historical delays; none should block the schedule-based prototype.

