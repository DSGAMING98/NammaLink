# Routing and optimization algorithms

Last updated: 29 October 2026

## Implemented schedule router

The current prototype uses bounded, round-constrained timetable enumeration. It is deliberately smaller than a production RAPTOR implementation, but it operates on real GTFS trip and stop-time records and is testable end to end.

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

The next scale step is a preprocessed Connection Scan Algorithm or RAPTOR implementation with spatial indexing and date-specific service materialization. The current pure functions and domain types provide a correctness oracle for that migration.

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
