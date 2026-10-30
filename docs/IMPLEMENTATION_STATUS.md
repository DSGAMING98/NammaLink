# Implementation Status

Last updated: 30 October 2026

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
| Google Maps / Places / Routes integration | Blocked | Variables are present, but two minimal Places API probes returned HTTP 403; no keys were exposed |
| Journey disruption evidence | Partially implemented | Typed report states and transparent scoring are tested; submission, persistence, and moderation UI remain |
| Recovery simulation | Simulated for demonstration | Verified-labelled synthetic incident preserves the completed leg and returns the next feasible continuation with a deadline violation |
| Authentication / moderation | Planned | Supabase variables present; backend state unverified |
| Notifications | Planned | In-app first; no external delivery provider verified |
| ML delay prediction | Blocked | No labelled observed arrival/delay data found |
| Schedule-based ETA baseline | Implemented and tested | GTFS times plus explicit walking/waiting; every output labelled scheduled |
| Full-network stop search | Implemented and tested | 10,043 searchable BMTC stops/BMRCL stations with mode and feed provenance |
| Full-network schedule routing | Implemented and benchmarked | 1,563,324-connection calendar-filtered CSA; depart-after/arrive-by, bus, Metro, interchange, 670 transfer footpaths, hard walking budgets, and safest/fastest/direct behavior |
| Native Android client | Implemented and physical-device validated | Compose APK, live autocomplete, permission-aware nearby-stop discovery, contract planning, geographic fallback, full-network rendering, coordinate-preserving offline save/restore, explicit bounded fallback; evidence under `research_outputs/device_evidence/` |
| APK distribution | Development preview available | Website serves a checksum-labelled debug-signed APK; production signing remains incomplete |
| Low-connectivity mode | Partially implemented | Android full-itinerary restoration passed with the backend tunnel removed; web connection status, local report queue, manifest, and service-worker shell cache remain, but web app-shell offline reload is not device-verified |
| Operator insights | Implemented and tested | Web and native views report full-feed totals plus top-eight scheduled route trip counts; bounded-fixture headways remain separately labelled; explicitly not ridership, punctuality, occupancy, revenue, or actual utilization |
| Deployment | Blocked on account connection | Application builds locally; connected Vercel context returned no team/project, so no deployment target is available |

