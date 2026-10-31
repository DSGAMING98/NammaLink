# Routing and optimization algorithms

Last updated: 30 October 2026

## Full-network Connection Scan

The city-scale schedule endpoint uses a preprocessed Connection Scan Algorithm index containing 1,563,324 time-sorted adjacent-stop connections from 61,115 BMTC and BMRCL trips. The 31.27 MB binary table is stored as a 14.29 MB gzip artifact and loaded once per server process.

Preprocessing rejects non-positive travel durations and movements above 25 m/s for buses or 45 m/s for Metro. Exactly 5,153 candidate bus connections are excluded; no Metro connection exceeds its gate. This protects routing from known coordinate/time defects without presenting the filter as observed operations data.

At query time the scan materializes the selected date's GTFS calendars and exceptions, then maintains earliest stop arrivals, cumulative transfer-walking distance, trip reachability, and connection-level predecessors. A passenger can remain aboard without a transfer penalty. `safest` requires 180 seconds before boarding a different trip, `fastest` removes that additional buffer, and `direct` forbids boarding after any transit ride. The index also contains 670 directed bus–Metro transfer footpaths between stops within 250 m. Walking uses 1.25 m/s and great-circle distance, is returned as an explicit estimated segment, participates in exact path reconstruction, and cannot exceed the request's 0–5,000 m budget.

The production API is `GET /api/network-journeys` with stop IDs, service date, exactly one of `departAfter=HH:MM` or `arriveBy=HH:MM`, `priority=safest|fastest|direct`, and `maxWalkingMeters`. Dates outside the shared static-feed window, 2026-09-07–2027-08-17, return HTTP 422. Results echo the applied contract and include both feed versions, active-trip count, index/filter/footpath statistics, scan count, query time, and `realtime: false`.

Arrive-by uses a monotone binary search over minute-precision start times. Each candidate runs the same calendar- and contract-filtered forward Connection Scan; feasibility means the reconstructed final arrival is no later than the requested deadline. The API returns the latest feasible start, the number of scans, and an explicit `deadlineMet` flag. This is deterministic schedule search, not a punctuality prediction.

Verified examples include Kempegowda Bus Station 08:00 → Central Silk Board 08:50 by bus; Whitefield Metro 08:00 → Challaghatta Metro 09:20 on the Purple Line; and 14th Main HSR Layout 08:02 → Whitefield Metro 09:15 using two buses, a 128 m estimated walk, and the Purple Line. Warm device-connected queries for the latter two measured 52 ms and 48 ms respectively; cold decompression is slower.

## Implemented schedule router

The reference router uses bounded, round-constrained timetable enumeration over real GTFS trip and stop-time records and is tested end to end.

The pipeline:

1. Filters trips through the GTFS service calendar for the selected date.
2. Parses GTFS service times, including hours beyond `24:00:00`.
3. Finds origin-access and destination-egress stops with great-circle distance.
4. Indexes scheduled departures by stop.
5. Enumerates feasible downstream trip legs and walking transfers for at most the passenger's requested transfer limit.
6. Applies walking, transfer, arrival-deadline, safety-buffer, and direct-only constraints before ranking.
7. Deduplicates equivalent itineraries and removes candidates dominated on duration, scheduled waiting, walking, and transfers.
8. Ranks the remaining choices for fastest, least waiting, least walking, direct preferred, or direct only.

Walking is currently estimated at 1.25 metres per second. Transfers use a two-minute boarding buffer and may connect stops within 400 metres. Transfer waits above 90 minutes are not explored. These assumptions are explicit constants and are not claims about station accessibility.

## Arrive-by behavior

For an arrive-by request, the router searches a bounded window ending at the deadline minus the requested safety allowance. Origin departure is calculated backwards from the first scheduled boarding and access walk. The result therefore recommends the latest door departure represented by each enumerated itinerary rather than pretending that schedule adherence is guaranteed.

## Data-source semantics

Every result from this engine is labelled `scheduled`. It does not use vehicle positions, observed arrivals, or a trained delay model. Fare remains `null` unless a complete, applicable fare rule can be proven.

## Central verified example

The committed BMTC fixture verifies a scheduled connection from Jain University Gate to Banashankari on route `O EXP V-213VJ` (`route_id 8931`), followed by route `600-CA` (`route_id 2704`) toward Chikka Hagade Gate near Alliance University. The integration test enforces an 800 metre total walking limit and one-transfer maximum. No direct service between the two campuses exists in the bounded fixture, and direct-only mode reports that gap.

This verifies dataset-supported timetable connectivity, not real-world operation or punctuality. A 09:00 arrival is not feasible in the fixture's tested morning schedule; the verified connection reaches the destination area shortly before 10:00 on static times.

## Complexity and scale boundary

The bounded enumerator is appropriate for the 53-trip demonstration fixture and completes the current test suite in well under one second. It caps explored boardings and reports when truncation occurs. It is not intended to enumerate the entire 57,836-trip feed in a request path.

The remaining scale steps are arbitrary-coordinate access/egress, pedestrian-network geometry, multi-label Pareto rounds, and explicit scan budgets. The bounded router remains a correctness oracle for constraints not yet moved into the city-scale scan.

## Evidence-aware disruption and recovery

Reports are classified as unverified, suspected, corroborated, verified, expired, or rejected. Freshness, independent corroboration, GPS confidence, moderator confirmation, and conflicting evidence contribute to a transparent score. Only a `verified` incident can invalidate a scheduled leg; one fresh report remains suspected and does not become a closure.

Recovery preserves completed legs, checks verified incidents against the remaining trip, route, and stops, excludes affected trips, and first searches under the original Journey Contract. If the deadline is impossible, a second search may relax only the deadline and returns that violation explicitly. The demonstration incident is synthetic and is marked simulated in the API and interface.

## Tests

The automated suite covers:

- GTFS times after midnight;
- invalid GTFS time values;
- service calendar bounds;
- direct and one-transfer journeys;
- direct-only rejection;
- impossible deadlines;
- excessive final walking;
- the real bounded Jain–Banashankari–Alliance-area connection; and
- honest absence of a direct central-demo option.
