# Implementation Status

Last updated: 30 October 2026

| Capability | Status | Evidence / limitation |
| --- | --- | --- |
| Repository and dataset audit | Implemented and tested | `docs/PROJECT_AUDIT.md`; verified against local files and Git state |
| Dataset inventory and provenance | Implemented and tested | `docs/DATASET_INVENTORY.md`; local counts and upstream sources recorded |
| Secret-safe environment template | Implemented and tested | `.env.example`, `.gitignore`; `.env.local` confirmed ignored |
| Next.js application | Implemented and tested | Next.js 16 App Router shell; unit tests, strict type-check, and production build pass |
| GTFS normalization | Partially implemented | Reproducible extraction creates a licensed 3-route, 53-trip bounded fixture; full BMTC/BMRCL materialization remains |
| Nearby-stop search | Implemented and tested | Great-circle radius search is covered by routing tests; production spatial index remains planned |
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
| Full-network stop search | Implemented and tested | 9,960-stop normalized API with embedded feed provenance |
| Full-network schedule routing | Implemented and benchmarked | 1,477,697-connection CSA index; three-minute transfers; static-feed validity gate |
| Native Android client | Implemented and physical-device validated | Compose APK, live network autocomplete, full-network journey rendering, explicit offline fallback; evidence under `research_outputs/device_evidence/` |
| APK distribution | Development preview available | Website serves a checksum-labelled debug-signed APK; production signing remains incomplete |
| Low-connectivity mode | Partially implemented | Connection status, saved journey, local report queue, manifest, and service-worker shell cache implemented; full offline device test remains |
| Operator insights | Implemented and tested | Bounded route trip counts, service spans, direction-aware median headways, and shared-stop analysis; explicitly not actual fleet utilization |
| Deployment | Blocked on account connection | Application builds locally; connected Vercel context returned no team/project, so no deployment target is available |

