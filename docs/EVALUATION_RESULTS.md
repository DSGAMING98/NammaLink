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

- 13 tests across 5 files pass.
- Strict TypeScript checking passes.
- Next.js production build passes, including dynamic `/api/journeys`.
- Invalid negative walking constraints receive HTTP 400.
- GTFS times beyond 24:00 and calendar date bounds are covered.
- Browser QA completed on the default desktop viewport and 390×844 mobile viewport.
- The interactive form returned the same scheduled central journey shown above.
- Browser console inspection returned no warnings or errors.

## Performance

The full automated suite completes in under one second on the current development machine. The central request explores 107 boardings in the bounded fixture. This is not a full-feed performance benchmark, so no production latency or feasible-route discovery rate is claimed.

## Failure cases and limitations

- No direct campus-to-campus service is present in the bounded fixture.
- A 5 km final walk is rejected by an 800 m hard limit, but actual walking geometry is not yet available.
- The result uses static schedules and cannot account for cancellation, congestion, or vehicle delay.
- No labelled arrival observations exist, so MAE/RMSE and delay-model improvement cannot be measured.
- Full BMTC/BMRCL multimodal routing, fares, accessibility constraints, and KSRTC remain outside this checkpoint.
