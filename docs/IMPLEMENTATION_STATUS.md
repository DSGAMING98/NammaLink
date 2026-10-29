# Implementation Status

Last updated: 29 October 2026

| Capability | Status | Evidence / limitation |
| --- | --- | --- |
| Repository and dataset audit | Implemented and tested | `docs/PROJECT_AUDIT.md`; verified against local files and Git state |
| Dataset inventory and provenance | Implemented and tested | `docs/DATASET_INVENTORY.md`; local counts and upstream sources recorded |
| Secret-safe environment template | Implemented and tested | `.env.example`, `.gitignore`; `.env.local` confirmed ignored |
| Next.js application | Planned | No package manifest or application code yet |
| GTFS normalization | Planned | Existing feeds inspected but not yet transformed |
| Nearby-stop search | Planned | Requires spatial index |
| Transit routing | Planned | Connection-scan-style engine selected for first implementation |
| Arrive-by and Journey Contract constraints | Planned | Domain model not yet implemented |
| Mobile-first journey UI | Planned | No UI code yet |
| Google Maps / Places / Routes integration | Planned | Variables present; access and restrictions unverified |
| Journey disruption reporting | Planned | No persistence or workflow yet |
| Recovery simulation | Planned | Required end-to-end demonstration not yet implemented |
| Authentication / moderation | Planned | Supabase variables present; backend state unverified |
| Notifications | Planned | In-app first; no external delivery provider verified |
| ML delay prediction | Blocked | No labelled observed arrival/delay data found |
| Schedule-based ETA baseline | Planned | Does not require ML labels |
| Low-connectivity mode | Planned | Browser storage/service worker not yet implemented |
| Operator insights | Planned | Historical ridership and schedules are available |
| Deployment | Planned | No application exists to deploy |

