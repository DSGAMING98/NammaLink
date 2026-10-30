# NammaLink Production MVP Engineering Roadmap

Updated: 30 October 2026

## Decision

The remaining work is divided into **11 implementation phases**:

- **5 engineering phases first**: make the installed app independent of USB/localhost, deployable, observable, secure, and release-testable.
- **6 feature phases second**: Google Maps, airport mode, Kannada/polish, verified schedules/fares, partner ticketing/revenue, and low-connectivity assistance.

Feature implementation does not begin until the Phase 27 connectivity gate passes on a physical phone with no `adb reverse`, no laptop server, and no local-network dependency.

## Round 3 failure and non-negotiable fix

The Android build currently defaults `NAMMALINK_API_BASE_URL` to `http://127.0.0.1:3000`. On an installed phone, `127.0.0.1` means the phone itself. It worked during development only because `adb reverse tcp:3000 tcp:3000` forwarded the phone's port to the laptop.

This was a release-blocking architecture defect. The permanent controls are:

1. Debug builds may use loopback only when a developer explicitly opts in.
2. Presentation/release builds must fail at build time if the backend URL is missing, HTTP-only, loopback, or a private development host.
3. The app must call a public `/api/health` endpoint before enabling online search.
4. Search must show actionable `service unavailable`, `offline`, `configuration error`, and `no results` states instead of a generic failure.
5. The physical-device release gate must run with USB forwarding removed and the laptop server stopped.

## Phase plan

| Phase | Type | Scope | Exit gate | Focused estimate |
| --- | --- | --- | --- | --- |
| **27. Production connectivity** | Engineering | Public HTTPS backend, `/api/health`, release URL validation, no-loopback build guard, connectivity state, retry-safe search | Search and routing work on the physical phone over normal internet with USB forwarding removed | 0.5–1 day, plus deployment access |
| **28. Deployment and secret boundaries** | Engineering | Reproducible web/API deployment, environment validation, server/client key separation, CORS policy, key restrictions, quota limits, deployment smoke tests | Fresh deployment passes health, stop search, route planning, and APK download smoke tests without exposing secrets | 0.5–1 day |
| **29. API gateway and data contracts** | Engineering | Typed Places/Geocoding/Routes gateway, request validation, Bengaluru bounds, caching, rate limiting, timeouts, normalized errors, dataset freshness metadata | Contract tests cover success, invalid input, quota/upstream failure, timeout, cache, and fallback behavior | 0.5–1 day |
| **30. Reliability, offline, and observability** | Engineering | Saved journeys, cached airport data, last-known successful results, structured privacy-safe logs, crash/error telemetry, health/version display, graceful degraded mode | Cold start, network loss, server failure, stale cache, recovery, and zero-network flows are device-tested | 0.5–1 day |
| **31. Release pipeline and acceptance QA** | Engineering | Release signing gate, versioning, CI artifact, install/upgrade testing, API-level matrix, accessibility checks, demo reset path, final checklist | A clean phone installs the exact CI artifact and passes search → plan → save → offline restore without developer tools | 0.5–1 day; signing requires owner keystore |
| **32. Google Maps and place planning** | Feature | Places autocomplete, arbitrary origin/destination, geocoding, real walking/road geometry, native map, markers, route polylines, map/satellite toggle | A user can select places, see a real mapped journey, and understand static-vs-live evidence | 1–1.5 days after APIs pass |
| **33. Bengaluru Airport mode** | Feature | To/from airport mode, current-location boarding discovery, KIA route list, next scheduled departures, stops, route lines, airport terminal context, freshness/source labels | Current location → suitable airport buses → scheduled options → full route renders on phone | 1–1.5 days |
| **34. Kannada, accessibility, and visual polish** | Feature | English/Kannada switch, translated journey/search/error strings, Kannada stop aliases where available, logo/brand pass, motion with reduced-motion support, large-text/touch-target QA | Core search, airport, journey, offline, and error flows work in both languages | 0.75–1 day |
| **35. Verified time slots, fares, and service state** | Feature | Schedule slots and fare display only from licensed/verified sources; freshness badges; realtime only through an authorized feed | Every time/fare/live value has source, timestamp, and fallback; no simulated value is labelled live | 1–2 days; realtime may remain blocked |
| **36. Ticket handoff and revenue instrumentation** | Feature | Authorized partner deep links, referral IDs, outbound-click analytics, return/callback handling where supported, conversion ledger, transparent hypothetical revenue calculator | Booking remains partner-managed; commissions are recorded only from verified eligible conversions | 1–2 days plus partner credentials/contracts |
| **37. Low-connectivity and sensor assistance** | Feature | Satellite map layer, downloaded journey snapshot, last-known GPS, compass/bearing assistance, low-data UI, explicit no-signal limitations | Useful saved guidance remains available without claiming satellite communication or live tracking | 0.75–1.5 days |

## Credible target for tomorrow's 50-mark MVP presentation

The full 11-phase end state is approximately **7–12 focused engineering days**, with deployment, signing, realtime, and ticketing-partner dependencies. It is not credible to claim every production integration is complete tomorrow.

The strongest honest presentation target is:

1. Phases 27–31 complete or all owner-dependent blockers clearly isolated.
2. Phase 32 complete: working Google place search and real mapped journey on the installed phone.
3. Phase 33 complete: focused airport mode using validated KIA schedule/route data.
4. Phase 34 core complete: Kannada switch for the primary passenger flow plus polished branding.
5. Phase 36 demonstration boundary: a clearly labelled partner handoff/deep-link flow and hypothetical revenue model; no fake completed booking or commission claim.
6. Phase 35 values limited to verified schedules/fares; no fabricated realtime state.
7. Phase 37 limited to satellite map toggle and saved/last-known guidance if time remains.

## Google Maps architecture

The existing local environment contains non-empty slots for Maps, Map ID, Routes, Places, and Geocoding. Values must never be printed, committed, or bundled into an unrestricted client.

### Required Google Cloud services

- Maps SDK for Android
- Places API (New)
- Routes API
- Geocoding API
- Maps JavaScript API only if the web surface embeds Google Maps
- Billing and quota alerts

### Key policy

- Android map key: restrict to the NammaLink package name and release/debug SHA certificate fingerprints.
- Browser key: restrict by approved HTTPS referrers and only the required Maps API.
- Server keys: restrict by API and deployment egress/IP where supported; never expose them through `NEXT_PUBLIC_*` values.
- Places, Routes, and Geocoding requests go through the NammaLink server gateway with validation, caching, rate limiting, and normalized errors.

The earlier HTTP 403 means the first implementation step is an enablement/restriction probe for each API. A populated environment variable is not proof that the service is usable.

## Airport-mode research and adoption plan

Reference implementation: [bengawalk/kia](https://github.com/bengawalk/kia) and [kia.bengawalk.com](https://kia.bengawalk.com/).

Verified useful patterns from the MIT-licensed project:

- separate **To airport** and **From airport** modes;
- English and Kannada language choices;
- current-location, text-search, and map-location states;
- KIA/Vayu Vajra route definitions covering the airport and major Bengaluru origins;
- generated timetable, stop, and route-line artifacts derived from BMTC GTFS;
- automated data regeneration and deployment;
- MapLibre route rendering;
- a server-side Google Places/Geocoding proxy that hides the key, validates Bengaluru bounds, caches responses, and rate limits cache misses.

NammaLink will adapt the architecture and data workflow, not blindly copy constants. Before admission:

1. Record the KIA code license (MIT) and the underlying GTFS/data licence separately.
2. Regenerate from the selected BMTC feed and validate route direction, stop sequences, service dates, coordinates, fares, and freshness.
3. Detect upstream anomalies instead of hardcoding them. For example, the inspected reference constants currently define `KIA-7 DOWN` with the same HSR KEB start and end, which must not be imported without correction from source data.
4. Add source URL, download date, record counts, limitations, and intended use to `docs/DATASET_INVENTORY.md`.
5. Keep raw feeds and caches out of Git; commit only reproducible scripts and appropriately sized derived artifacts.

### Airport passenger flow

1. Choose **To airport** or **From airport**.
2. Use current location, search a place, or select on the map.
3. Rank suitable airport services by scheduled door-to-terminal arrival, access walking, waiting, transfers, and data freshness.
4. Show route, stops, next scheduled departures, terminal/airport context, verified fare if available, and source limitations.
5. Save the journey for low-connectivity use.

## Ticketing and revenue boundary

The proposed model is valid only as a partner handoff:

1. Plan in NammaLink.
2. Open an authorized Namma BMTC, Namma Metro, or ONDC-compatible buyer app/site with a referral/deep-link identifier.
3. The partner handles login, payment, ticket issuance, cancellation, refund, and support.
4. NammaLink records revenue only after an authenticated partner callback/report confirms an eligible booking.

The handwritten example is mathematically consistent but remains hypothetical:

- 10,000 active commuters × 10% conversion = 1,000 completed referred bookings.
- 1,000 × assumed ₹5 commission = ₹5,000 gross monthly referral revenue.

The dashboard must label every input as an assumption until a signed partner agreement and actual conversion data exist. It must not display hypothetical revenue beside real operator metrics without a visual separation.

## Feature interpretation from the handwritten notes

- **Maps API green/working** → Phase 27/28 connectivity first, then Phase 32 Google Maps.
- **Airport tracking** → scheduled KIA discovery and planning first; live bus tracking only with an authorized realtime feed.
- **Revenue model** → partner handoff and verified referrals, not NammaLink-owned ticket/payment processing.
- **Route time slots and fares** → show only verified feed/authority values with freshness.
- **Shortest/time-saving route options** → retain current contract comparison and extend it to Google walking/road geometry.
- **Satellite** → Google satellite map layer; it does not create connectivity.
- **Phone sensors where 5G is weak** → last-known GPS/compass/offline saved journey; do not claim satellite communication.
- **Kannada** → full core-flow localization, not a single translated landing page.
- **UI/logo/animations** → polish after functional and offline acceptance gates; respect reduced-motion settings.
- **Confirm APK and website availability** → public HTTPS backend, release artifact, checksum, and clean-phone smoke test in Phase 31.

## Inputs needed before implementation

No additional API key is required to start the engineering phases. Before the relevant gates, the owner must provide or confirm:

1. A public deployment target/domain and access (Vercel, Cloudflare, Render, or equivalent).
2. Google Cloud billing plus the required APIs enabled and key restrictions that match web, server, and Android use.
3. Android release keystore values for a production-signed build.
4. Authorized ticketing partner URLs, referral scheme, callback contract, and test credentials.
5. Any authorized BMTC/BMRCL realtime and official fare source credentials.

If items 4 or 5 are unavailable, NammaLink will ship a transparent partner-handoff prototype and static-schedule/fare evidence only. It will not fabricate transactions, commissions, vehicle positions, or realtime arrivals.

## Definition of MVP complete

MVP completion requires all of the following evidence:

- the installed APK works without USB, localhost, or a developer laptop;
- public health, search, route, and airport endpoints pass production smoke tests;
- Google APIs pass restricted-key tests without leaking secrets;
- airport data has recorded provenance/licence/freshness and schema validation;
- primary English and Kannada passenger flows pass physical-device QA;
- offline save/restore and degraded states pass with the backend unavailable;
- ticketing/revenue screens distinguish verified partner events from assumptions;
- tests, type-check, production builds, release checks, documentation, CI, and GitHub push all pass;
- no live, ML, revenue, fare, or performance metric is claimed without supporting evidence.
