# Evaluation results

Last updated: 29 October 2026

## Scope

This checkpoint evaluates the bounded schedule-routing prototype, not the complete BMTC network and not real-world punctuality. The input is the committed ODbL demo fixture derived from BMTC community GTFS version `20260907`.

## Central journey

| Item | Verified result |
| --- | --- |
| Origin | Jain University, Faculty of Engineering and Technology, Jakkasandra |
| Destination | Alliance University, Central Campus |
| Arrival deadline | 10:05 service time on 29 October 2026 |
| Walking limit | 800 m total |
| Transfer limit | 1 |
| Recommended door departure | 06:39 |
| Scheduled arrival | 09:58 |
| Transit legs | `O EXP V-213VJ` to Banashankari; `600-CA` to Chikka Hagade Gate |
| Scheduled transfer wait | 5 minutes |
| Estimated walking | 757 m |
| Transfers | 1 |
| Search effort | 107 trip boardings evaluated; no diagnostic truncation |

The result is deterministic and labelled `scheduled`. The 06:45 first boarding, 08:00 Banashankari arrival, 08:05 second boarding, and 09:54 Chikka Hagade Gate arrival come from the fixture's GTFS stop times. Door times add straight-line access/egress walking at 1.25 m/s. Walking paths have not yet been validated against a pedestrian network.

Direct-only mode returns no journey for this bounded network. A 09:00 deadline is not feasible for the tested morning connection. These are coverage and schedule findings, not statements that no current service exists outside the selected fixture.

## Automated verification

- 20 tests across 8 files pass.
- Strict TypeScript checking passes.
- Next.js production build passes, including dynamic `/api/journeys`.
- Invalid negative walking constraints receive HTTP 400.
- GTFS times beyond 24:00 and calendar date bounds are covered.
- Browser QA completed on the default desktop viewport and 390×844 mobile viewport.
- The interactive form returned the same scheduled central journey shown above.
- Browser console inspection returned no warnings or errors.

## Performance

The full automated suite completes in under one second on the current development machine. The central request explores 107 boardings in the bounded fixture. This is not a full-feed performance benchmark, so no production latency or feasible-route discovery rate is claimed.

## Simulated recovery result

A clearly labelled simulated incident invalidates the originally selected `600-CA` trip after the passenger has completed the Jain Gate–Banashankari leg. The engine preserves that completed leg and excludes the affected trip. No continuation can satisfy the original 10:05 deadline, so the result explicitly marks the deadline at risk and returns the next scheduled `600-CA`: replan at 08:00, board at 08:45, and reach the destination at approximately 10:38 with 311 m estimated walking.

The simulation is verified by unit/API tests and the browser flow. An unverified version of the same report does not invalidate the journey.

## Low-connectivity verification

The production server exposes a manifest and service worker with explicit no-cache and content-security headers. Browser QA verified the online status indicator, last-journey persistence across reload, and a deduplicated local report queue. The queue is limited to 20 drafts and states that nothing is uploaded. A full offline reload was not automated in the in-app browser, so app-shell fallback remains implemented but not end-to-end device-verified.

## Operator schedule analysis

The bounded fixture contains 53 scheduled trips across 216 referenced stops and 3 selected routes. Direction-aware median scheduled headways are 48 minutes for `O EXP V-213VJ` (32 trips), 50 minutes for `600-CA` (17 trips), and 32 minutes for `365-BB BSK-BNP-ANK` (4 trips). The displayed service spans are 05:30–21:35, 07:20–16:30, and 17:13–20:00 respectively.

These values describe the committed static fixture only. They do not measure occupancy, ridership, vehicles dispatched, on-time performance, or actual fleet utilization.

## Failure cases and limitations

- No direct campus-to-campus service is present in the bounded fixture.
- A 5 km final walk is rejected by an 800 m hard limit, but actual walking geometry is not yet available.
- The result uses static schedules and cannot account for cancellation, congestion, or vehicle delay.
- No labelled arrival observations exist, so MAE/RMSE and delay-model improvement cannot be measured.
- Full BMTC/BMRCL multimodal routing, fares, accessibility constraints, and KSRTC remain outside this checkpoint.
