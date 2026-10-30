# Implementation Status

Last updated: 31 October 2026

| Capability | Status | Evidence / limitation |
| --- | --- | --- |
| Repository and dataset audit | Implemented and tested | `docs/PROJECT_AUDIT.md`; verified against local files and Git state |
| Dataset inventory and provenance | Implemented and tested | `docs/DATASET_INVENTORY.md`; local counts and upstream sources recorded |
| Secret-safe environment template | Implemented and tested | `.env.example`, `.gitignore`; `.env.local` confirmed ignored |
| Next.js application | Implemented and tested | Next.js 16 App Router shell; unit tests, strict type-check, and production build pass |
| GTFS normalization | Implemented and tested | Reproducible bounded fixture plus combined BMTC/BMRCL stop, calendar, connection, and footpath indexes |
| Nearby-stop search | Implemented and physical-device validated | Bounded great-circle API lookup plus Android on-demand permission/fix flow; real Bengaluru positive results are API-tested, while the connected device correctly exercised the outside-five-kilometre fallback |
| Door-to-stop access contract | Implemented and tested | Nearby-origin coordinates create an estimated access walk, consume the same maximum-walking budget, shift depart-after scanning, and adjust arrive-by door departure; over-budget access returns no journey with evidence |
| Journey recommendation evidence | Implemented and physical-device validated | Full-network API and Android result expose timetable-derived duration/waiting plus safest, fastest, or direct contract reasons; explicitly not a live-delay prediction |
| Journey contract comparison | Implemented and physical-device validated | Android compares feasible safest/fastest/direct searches under the same request and walking cap; door-to-arrival duration includes initial wait and each connection wait is rendered explicitly |
| Selectable contract alternatives | Implemented and physical-device validated | Returned comparison rows switch the complete journey without replanning; schema-version-5 save/restore retains all alternative itineraries for offline switching |
| Native journey map | Implemented and physical-device validated fallback | Projects actual ride/walk endpoint coordinates with bus/Metro/walk legend and transfer nodes; a requested current fix is session-only and shown only near the route; explicitly not street or pedestrian geometry |
| Transit routing | Implemented and tested | Bounded schedule enumerator, Pareto pruning, and real central-demo integration tests pass |
| Arrive-by and Journey Contract constraints | Implemented and tested | Deadline, safety buffer, walking, transfers, and five ranking preferences are enforced in pure TypeScript |
| Journey API | Implemented and tested | Zod-validated POST endpoint returns source-labelled schedule results; API tests cover valid and invalid requests |
| Mobile-first journey UI | Implemented and tested | Interactive Journey Contract and itinerary timeline verified in desktop and 390×844 browser views |
| Google Maps service gateway | Implemented and contract-tested; Places degraded | Server-only autocomplete, geocoding, place resolution, and walking-route endpoints have validation, Bengaluru bounds, rate limits, timeouts, request IDs, and normalized errors. Routes/Geocoding probes pass; Places key restrictions return HTTP 403 |
| Phase 32 place/map planning | Implemented and browser-tested | Arbitrary place autocomplete with verified-stop fallback; nearest supported stop resolution; walking guidance without mandatory cutoff; real OSM/satellite tiles, GTFS route polylines, stop/transfer markers, framing, and layer toggle |
| Phase 33 Bengaluru Airport Mode | Implemented and browser/API-tested; Android compiled | Reproducible 44-direction Vayu Vajra derivative, To/From Airport, corridor/location ranking, 1,101 scheduled departures, complete stop sequences, map, provenance, offline save, fare evidence, and error states; no live claim |
| Phase 34 Kannada/accessibility | Core passenger flow implemented | Persistent web English/Kannada switch and Android Airport language switch; responsive layouts, labelled controls, touch targets, and reduced-motion support. Verified stop names remain source-native where no Kannada alias exists |
| Phase 35 time/fare/service state | Implemented with evidence boundaries | Schedule labels, Asia/Kolkata queries, feed validity, static/live distinction, GTFS fare ranges, missing-fare state, and 2025 PDF historical warning; no simulated live arrival |
| Phase 36 ticket/revenue | Transparent handoff prototype implemented | Official Namma BMTC 2.0 external handoff; device-local outbound-click ledger, zero verified conversions without callbacks, and explicitly hypothetical commission calculator; no payment collection or partnership claim |
| Phase 37 low-connectivity/sensors | Implemented for saved guidance | City/airport snapshots, last-sync timestamp, last-known GPS context, retry/fallback behavior, web/Android compass guidance, low-data views, and explicit satellite/GPS limitations |
| Journey disruption evidence | Partially implemented | Typed report states and transparent scoring are tested; submission, persistence, and moderation UI remain |
| Recovery simulation | Simulated for demonstration | Verified-labelled synthetic incident preserves the completed leg and returns the next feasible continuation with a deadline violation |
| Authentication / moderation | Planned | Supabase variables present; backend state unverified |
| Notifications | Planned | In-app first; no external delivery provider verified |
| ML delay prediction | Blocked | No labelled observed arrival/delay data found |
| Schedule-based ETA baseline | Implemented and tested | GTFS times plus explicit walking/waiting; every output labelled scheduled |
| Full-network stop search | Implemented and tested | 10,043 searchable BMTC stops/BMRCL stations with mode and feed provenance |
| Full-network schedule routing | Implemented and benchmarked | 1,563,324-connection calendar-filtered CSA; depart-after/arrive-by, bus, Metro, interchange, 670 transfer footpaths, hard walking budgets, and safest/fastest/direct behavior |
| Native Android client | Implemented and physical-device validated | Compose APK, live autocomplete, permission-aware nearby-stop discovery, contract planning, geographic fallback, full-network rendering, coordinate-preserving offline save/restore, explicit bounded fallback; evidence under `research_outputs/device_evidence/` |
| APK distribution | Presentation build available | Website serves a checksum-labelled, debug-certificate presentation APK compiled against the public HTTPS backend; store signing remains incomplete |
| Low-connectivity mode | Implemented for core Android journey continuity | Android service readiness, retry, unavailable state, explicit offline demo, and full-itinerary restoration are physical-device verified; web polls real backend health and retains its existing app shell/save behavior |
| Operator insights | Implemented and tested | Web and native views report full-feed totals plus top-eight scheduled route trip counts; bounded-fixture headways remain separately labelled; explicitly not ridership, punctuality, occupancy, revenue, or actual utilization |
| Public deployment | Implemented and verified | Git-connected personal Vercel project is READY at `https://nammalink.vercel.app`; unauthenticated health, stop search, full-network journey, and physical-phone no-tunnel flows pass |
| Android production connectivity | Implemented and physical-device validated | Debug and presentation/release variants are separated; distributable builds require public HTTPS and disable cleartext, startup checks backend health, and unavailable state preserves offline access |
| Release pipeline | Implemented except owner signing/publish | CI verifies web, secret hygiene, debug APK, endpoint fail-closed behavior, and presentation compilation; release remains correctly blocked without owner keystore |

