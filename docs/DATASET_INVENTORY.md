# Dataset Inventory

Last updated: 31 October 2026

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
| BMTC Vayu Vajra airport timetable PDF | `../Airport bus timings.pdf` | Local BMTC-formatted document, title `Vayuvajra Form-3.xls` | Reference-only; underlying rights not independently established | 3 pages; W.E.F. 17 September 2026; KIA-4 through KIA-15A frequency table | Manual sample validation of airport routes and departure patterns | PDF extraction is column-ambiguous; normalized product data comes from stop-level GTFS instead |
| BMTC Vayu Vajra fare PDF | `../Airport bus prices.pdf` | Local BMTC-formatted document, title `Main Bus Stop Wise Vayuvajra Fare 2025.xls` | Historical reference-only; underlying rights not independently established | 3 pages; dated 5 January 2025; stop-wise prices for KIA routes | Historical fare cross-check only | Not current; values are never labelled as current fares |
| Bengawalk KIA reference source | `../kia-main/kia-main/` | [bengawalk/kia](https://github.com/bengawalk/kia) | MIT for source code; transit data rights remain separate | Reference transformation, route-direction, map, search, and Kannada architecture | Engineering reference and attribution | NammaLink does not copy branding or trust constants without current GTFS validation |

## Committed bounded fixture

`data/demo-network.json` is an intentionally small ODbL derivative generated from BMTC feed version `20260907`. It contains routes `8931`, `2704`, and `8950`: 3 routes, 216 referenced stops, 53 trips, and 1,343 stop times (241,296 bytes). It was generated on 29 October 2026 with `npm run data:build`; SHA-256 is `F1156DC7B580712B275F0F75BF7B1A5927C597F1C603F52DEA0120E7454F7780`.

Its intended use is deterministic routing tests and the Jain–Banashankari–Alliance-area demonstration. It is not a replacement for the full feed and is not evidence of live operation. Attribution and reproduction instructions are in `data/README.md`.

## Committed multimodal stop-search index

`data/transit-stops.json` is a 1.24 MB ODbL derivative containing 9,960 searchable BMTC stops, 83 searchable BMRCL stations, and 170 internal Metro platform nodes. BMTC `stops.txt` SHA-256 is `bc3cceb62c79b5fdd3bf6f4879a80c9c84bd60f2a73a3b7f3cedea2bcd410d81`; BMRCL `stops.txt` SHA-256 is `ff4e4a68097ef52ec994445e65421b03df40531980b1999178df7a2a026ebfd3`. It is rebuilt with `npm run data:build-stops`; platform nodes are not exposed as user suggestions.

## Committed full-network connection index

`data/transit-connections.bin.gz` (14.29 MB) and `data/transit-connections.meta.json` contain the reproducible multimodal routing derivative: 61,115 trips, 1,563,324 time-sorted adjacent-stop connections, GTFS calendars/exceptions, and 670 directed bus–Metro transfer footpaths. Preprocessing rejected 5,153 candidate BMTC connections with non-positive duration or implied speed above 25 m/s; Metro uses a 45 m/s gate and had no rejection. Transfer footpaths join stops within 250 m using great-circle distance and 1.25 m/s, not a pedestrian network. The index contains no observed arrivals, realtime state, accessibility guarantee, or reliability labels.

## Committed airport network derivative

`data/airport-network.json` is regenerated by `pnpm data:build-airport` from the local BMTC static GTFS. It contains 44 direction-correct KIA-family route variants, 1,101 unique scheduled origin departures, canonical stop sequences, service IDs/calendars, coordinates, and GTFS fare ranges. Feed version `20260907` is valid from 7 September 2026 through 7 September 2027. The generator excludes the explicit `KIA Test AFCS` route and identifies the airport by the actual Kempegowda/airport terminal name, preventing `Electronic City KIA` from being misclassified as the airport. It contains no live vehicle positions or guaranteed current fares.

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

