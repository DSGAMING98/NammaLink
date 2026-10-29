# Implementation Status

Last updated: 29 October 2026

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
| Mobile-first journey UI | In progress | Responsive landing and Journey Contract concept are implemented; form and results are not connected yet |
| Google Maps / Places / Routes integration | Blocked | Variables are present, but two minimal Places API probes returned HTTP 403; no keys were exposed |
| Journey disruption reporting | Planned | No persistence or workflow yet |
| Recovery simulation | Planned | Required end-to-end demonstration not yet implemented |
| Authentication / moderation | Planned | Supabase variables present; backend state unverified |
| Notifications | Planned | In-app first; no external delivery provider verified |
| ML delay prediction | Blocked | No labelled observed arrival/delay data found |
| Schedule-based ETA baseline | Planned | Does not require ML labels |
| Low-connectivity mode | Planned | Browser storage/service worker not yet implemented |
| Operator insights | Planned | Historical ridership and schedules are available |
| Deployment | Planned | Application builds locally; no deployment has been created or verified |

