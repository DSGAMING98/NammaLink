# Evaluation results

Last updated: 30 October 2026

## Scope

This report covers both the bounded Journey Contract correctness fixture and the city-scale static BMTC/BMRCL Connection Scan. It does not evaluate real-world punctuality because no observed-arrival labels are available.

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

- 36 tests across 14 files pass.
- Strict TypeScript checking passes.
- Next.js production build passes, including dynamic `/api/journeys`.
- Invalid negative walking constraints receive HTTP 400.
- GTFS times beyond 24:00 and calendar date bounds are covered.
- Browser QA completed on the default desktop viewport and 390×844 mobile viewport.
- The interactive form returned the same scheduled central journey shown above.
- Browser console inspection returned no warnings or errors.

## Performance

The pure bounded suite completes in under one second on the current development machine. The complete suite, including real 31.27 MB indexed API scans, completes in approximately 3.5 seconds. This is local benchmark evidence, not a hosted service-level objective.

## City-scale multimodal results

The committed index contains 61,115 scheduled trips, 1,563,324 admitted connections, and 670 directed bus–Metro transfer footpaths. Friday 30 October 2026 activates 58,737 trips after GTFS calendar/exception filtering; Sunday 1 November activates 58,451.

| Query | Verified scheduled result | Measured connected-device scan |
| --- | --- | --- |
| Kempegowda Bus Station → Central Silk Board, after 08:00 | 08:00–08:50; routes `316-B` and `G-3 SJSCBSE-CSB`; 1 transfer | 175 ms in the earlier bus-only device run |
| Whitefield (Kadugodi) Metro → Challaghatta Metro, after 08:00 | 08:00–09:20; Purple Line; 36 stops; 0 transfers | 52 ms |
| 14th Main HSR Layout → Whitefield Metro, after 08:00 | 08:02–09:15; two BMTC legs, 128 m estimated transfer walk, Purple Line; 2 transit transfers | 48 ms |
| Same mixed query, 100 m walking budget | 08:02–09:15; alternate 83 m transfer from Kundalahalli Metro Station; contract satisfied | Production API regression check |
| Kempegowda Bus Station → Central Silk Board, Direct, 400 m budget | 09:55–10:42; route `348-C`; 0 transfers; 0 m walking | 53 ms on physical device |
| Kempegowda Bus Station → Central Silk Board, arrive by 11:00, Safest, 400 m budget | Latest start 10:10; arrival 10:42; routes `O EXP-356KA` + `348-C`; deadline met; 0 m walking | 859 ms / 10 scans on physical device |

The mixed result demonstrates exact reconstruction of ride and walking segments. Transfer walking is great-circle distance at 1.25 m/s between stops no more than 250 m apart; it is not claimed as accessible or pedestrian-network-valid geometry.

Arrive-by performance includes repeated forward scans rather than one scan. The result is a local routing benchmark and does not measure realtime punctuality.

## Simulated recovery result

A clearly labelled simulated incident invalidates the originally selected `600-CA` trip after the passenger has completed the Jain Gate–Banashankari leg. The engine preserves that completed leg and excludes the affected trip. No continuation can satisfy the original 10:05 deadline, so the result explicitly marks the deadline at risk and returns the next scheduled `600-CA`: replan at 08:00, board at 08:45, and reach the destination at approximately 10:38 with 311 m estimated walking.

The simulation is verified by unit/API tests and the browser flow. An unverified version of the same report does not invalidate the journey.

## Low-connectivity verification

The production server exposes a manifest and service worker with explicit no-cache and content-security headers. Browser QA verified the online status indicator, last-journey persistence across reload, and a deduplicated local report queue. The queue is limited to 20 drafts and states that nothing is uploaded. A full offline reload was not automated in the in-app browser, so app-shell fallback remains implemented but not end-to-end device-verified.

The native Android client separately passed an offline-restoration test: a complete real indexed itinerary was saved as a versioned private payload, the USB backend tunnel was removed, and the same timeline and contract were restored after force-stop/relaunch. This validates local itinerary recovery, not offline replanning or schedule freshness.

## Current-location and nearby-stop verification

The stop API now accepts validated latitude/longitude input and returns up to 25 searchable stops ordered by great-circle distance within a server-bounded 100–5,000 m radius. Tests cover distance calculation, ordering, radius filtering, hidden-platform exclusion, invalid coordinates, and a positive real-index query near Kempegowda Bus Station.

On the physical Vivo V2513, the app displayed the Android precise/approximate permission dialog only after the nearby-stop action. Denial returned to a usable manual-search state. After permission was granted, the platform supplied a current fix with 70 m reported accuracy; no indexed stop was within five kilometres of that physical position, so the app displayed the supported-area fallback rather than fabricating a nearby result. This validates permission, fix acquisition, backend lookup, and the out-of-coverage state; it does not claim continuous tracking or broad geographic coverage.

## Native geographic fallback verification

Android now retains the latitude/longitude of every ride and transfer endpoint returned by the indexed journey API. The native fallback projects those real coordinates into a bounded local view, colours bus, Metro, and walking segments separately, and labels the result `straight stop-to-stop estimates`. It does not use road geometry, pedestrian paths, map tiles, or a live vehicle layer.

Physical-device QA planned the real 08:00 Kempegowda Bus Station → Central Silk Board journey and rendered its St Josephs Indian School/Malya Hospital transfer at the corresponding projected coordinate. The coordinate-bearing journey was saved as storage schema version 2, the USB backend reverse was removed, and the app was force-stopped and relaunched. The same geographic fallback and both route legs restored with no reverse mapping present. The post-flow device log contained no NammaLink fatal exception or ANR.

A second device flow planned the real 08:02 14th Main HSR Layout → Whitefield Metro journey. The map and timeline consistently rendered two BMTC legs in green, the 128 m estimated transfer walk in amber, and the Purple Line leg in purple. The bus/Metro/walk legend remained visible. A current device fix obtained earlier in the active session was outside the plotted journey bounds, so the app disclosed that state instead of distorting the route or drawing a misleading marker. Changing tabs no longer carries the planner's scroll offset into the journey screen.

## Door-to-stop access contract

A production API query from a coordinate near Kempegowda Bus Station measured a 116 m straight-line access walk. Under an 800 m walking contract, the engine reserved 116 m for access, left 684 m for indexed transfer footpaths, set door departure to 08:00, estimated stop arrival at 08:01, and boarded the first scheduled service at 08:15. A second query measured 2,447 m to the same stop under a 100 m contract and correctly returned no journey with an explicit over-budget explanation.

The physical Android regression used manually selected stops and retained the existing 0/800 m walking contract with no injected current-location leg. This proves the optional access parameters do not alter ordinary stop-to-stop planning. The connected device was outside nearby-stop coverage, so a positive access-leg Android rendering remains API/integration-tested rather than physically exercised at an in-coverage location.

## Timetable waiting and recommendation evidence

The full-network API now calculates door-to-destination duration and scheduled waiting directly from the selected itinerary's departure/arrival times. A production query for the default 08:00 Kempegowda Bus Station → Central Silk Board safest contract returned a 50-minute journey with 360 seconds (6 minutes) of scheduled waiting. A 07:50 fastest Metro query returned an 80-minute journey with zero scheduled waiting. The API also returns contract-specific reasons without claiming live-delay or ML evidence.

On the physical Vivo V2513, Android rendered `50 min journey · 6 min scheduled waiting`, the `Protected-transfer recommendation`, the three-minute vehicle-change rule, and walking-limit evidence. Storage schema version 3 preserved the same duration, waiting, and reasons after saving, removing the backend reverse mapping, force-stopping, and relaunching. The post-flow log scan contained no fatal exception or ANR.

## Contract comparison and connection-wait evidence

Android now runs the same origin, destination, time mode, and walking cap through each feasible safest, fastest, and direct contract. For the 08:00 Kempegowda Bus Station → Central Silk Board request, safest and fastest both produced 08:00–08:50, 50-minute results with 6 minutes of scheduled waiting and one change. Direct produced 08:00–10:42, 162 minutes door-to-arrival with 115 minutes of initial waiting and no changes. This exposes the real cost of avoiding a transfer instead of presenting only its 47-minute onboard span.

The selected safest itinerary rendered its 08:09–08:15 connection as an explicit `Wait 6 min` step at St Josephs Indian School/Malya Hospital. Storage schema version 4 preserved all three comparison rows and the wait step after save, backend disconnection, force-stop, and relaunch. Infeasible contract searches are omitted rather than synthesized.

## Selectable alternative and offline switching evidence

On the physical device, tapping the Direct comparison row replaced the complete result with the real `348-C` itinerary: 09:55 boarding, 10:42 arrival, zero transfers, 162 minutes door-to-arrival, and an explicit 115-minute scheduled wait before departure. The selected marker and recommendation changed to Direct without returning to the planner or issuing another request.

The direct result and every returned alternative were saved with storage schema version 5. After removing the backend reverse mapping, force-stopping, and relaunching, the direct result restored offline. Tapping Safest then switched offline to the complete 08:00–08:50 two-leg itinerary with one transfer and six minutes of scheduled waiting. The device log remained free of fatal exceptions and ANRs.

## Operator schedule analysis

The bounded fixture contains 53 scheduled trips across 216 referenced stops and 3 selected routes. Direction-aware median scheduled headways are 48 minutes for `O EXP V-213VJ` (32 trips), 50 minutes for `600-CA` (17 trips), and 32 minutes for `365-BB BSK-BNP-ANK` (4 trips). The displayed service spans are 05:30–21:35, 07:20–16:30, and 17:13–20:00 respectively.

The full-feed web and native dashboards separately report 10,043 searchable stops, 61,115 trips, 4,419 route records, 1,563,324 admitted connections, 670 transfer footpaths, and 5,153 rejected implausible connections. Their route bars show scheduled trip counts for Purple (1,265), Green (1,149), Yellow (865), `375-D` (398), `401-M` (328), `378` (318), `410-FA` (316), and `226-N` (310). Physical-device screenshots and UI hierarchies confirm that all counts and the supply-only disclaimer render on Android.

These values describe static schedule records only. They do not measure occupancy, ridership, vehicles dispatched, on-time performance, revenue, or actual fleet utilization.

## Failure cases and limitations

- No direct campus-to-campus service is present in the bounded fixture.
- A 5 km final walk is rejected by an 800 m hard limit, but actual walking geometry is not yet available.
- The result uses static schedules and cannot account for cancellation, congestion, or vehicle delay.
- No labelled arrival observations exist, so MAE/RMSE and delay-model improvement cannot be measured.
- Arbitrary-coordinate access/egress, pedestrian geometry, accessibility constraints, realtime state, and KSRTC remain outside the current release.
