# Full-network Android validation

Validated on 30 October 2026 using a USB-connected Vivo V2513 running Android 16/API 36. The installed debug APK reached the local production server through `adb reverse tcp:3000 tcp:3000`.

## Stop autocomplete

- Entered `kempe` in the origin field.
- The live `/api/stops` response rendered multiple real indexed results, including Kempegowda Arch (`30988`, `33443`) and Kempegowda Bus Station (`20921`, `20921_ST`, `20922`).
- Evidence: `network-autocomplete.png` and `network-autocomplete.xml`.

## Full-network journey

- Planned Kempegowda Bus Station to Central Silk Board after 08:00 using the selected indexed stop IDs.
- The native client rendered an 08:50 arrival with one transfer and a measured server scan of 175 ms.
- Leg 1: route `316-B`, 08:00, Kempegowda Bus Station to St Josephs Indian School / Malya Hospital, 5 stops.
- Leg 2: route `G-3 SJSCBSE-CSB`, 08:15, St Josephs Indian School / Malya Hospital to Central Silk Board, 17 stops.
- The UI retained the explicit static-schedule/no-live-position/no-trained-model disclosure.
- Evidence: `network-journey.png` and `network-journey.xml`.

## Stability

The post-flow device log scan matched no `FATAL EXCEPTION`, NammaLink ANR, or AndroidRuntime fatal entry. These checks validate the connected prototype path; they do not establish production availability, realtime accuracy, or broad device compatibility.

## Metro and mixed-mode extension

- Searched and selected BMRCL stations from the unified 10,043-stop endpoint.
- Verified Whitefield (Kadugodi) Metro 08:00 → Challaghatta Metro 09:20 on the Purple Line: 36 stops, zero transfers, 52 ms measured scan.
- Verified 14th Main HSR Layout 08:02 → Whitefield Metro 09:15: two BMTC legs, a clearly labelled 128 m estimated transfer walk, and a six-stop Purple Line leg; 48 ms measured scan.
- The updated APK installed successfully on the Vivo V2513, rendered bus, walk, and Metro cards, and produced no fatal/ANR log match.
- Evidence: `metro-journey.png`, `metro-journey.xml`, `mixed-journey.png`, and `mixed-journey-lower.xml`.

## City-scale Journey Contract extension

- Selected `Direct` and a 400 m walking budget in the native planner; both values were sent to the production API instead of remaining decorative controls.
- Verified Kempegowda Bus Station 09:55 → Central Silk Board 10:42 on direct route `348-C`: zero transfers, zero walking, 20 stops, and a 53 ms measured scan.
- The native result displayed `Direct contract · 0/400 m walk`; screenshot and UI hierarchy are saved as `contract-direct-result.png` and `contract-direct-result.xml`.
- A separate real-index API regression showed that tightening the HSR Layout → Whitefield Metro walking budget from 400 m to 100 m selected an alternate 83 m Kundalahalli transfer while preserving the 09:15 arrival.
- The updated APK streamed installation passed, and the post-flow device log scan found no NammaLink fatal exception or ANR.

## Arrive-by Journey Contract

- Selected `Arrive by` with an 11:00 deadline, Safest priority, and a 400 m walking budget on the physical Vivo V2513.
- The city-scale deadline search returned the latest 10:10 start and a 10:42 arrival via `O EXP-356KA` and `348-C`, with one transfer and 0 m walking.
- The native result displayed `Deadline 11:00 met · latest start 10:10`; the measured search was 859 ms and used 10 minute-precision scans.
- Evidence: `arrive-by-planner.xml`, `arrive-by-result.png`, and `arrive-by-result.xml`.
- Streamed installation passed and the post-flow log scan found no NammaLink fatal exception or ANR.

## Full-itinerary offline restoration

- Planned and saved the 08:00 Kempegowda Bus Station → Central Silk Board full-network journey, including both route legs and its applied Safest/800 m contract.
- Confirmed the private app preferences contained a versioned `saved_network_journey` payload rather than only a boolean flag.
- Removed the USB backend tunnel, force-stopped the app, relaunched it without a reachable server, and opened the Journey tab.
- The native UI restored the same 08:00–08:50 itinerary, routes `316-B` and `G-3 SJSCBSE-CSB`, transfer count, contract, timeline, and `Saved ✓` state without a network request.
- Evidence: `offline-save-saved.xml`, `offline-restore-result.png`, and `offline-restore-result.xml`; post-restore fatal/ANR scan was clean.

## Full-feed operator evidence

- Opened the native Operator tab on the updated APK and verified the combined BMTC/BMRCL totals: 10,043 searchable stops, 61,115 trips, 4,419 route records, 1,563,324 admitted connections, 670 transfer footpaths, and 5,153 rejected connections.
- Verified the explicit `0 trained ML models` evidence gate and explanation that evaluation charts require labelled observed arrivals.
- Verified exact scheduled trip-count labels for the top eight routes: Purple 1,265; Green 1,149; Yellow 865; `375-D` 398; `401-M` 328; `378` 318; `410-FA` 316; and `226-N` 310.
- Verified the complete disclaimer stating that the bars are not ridership, punctuality, occupancy, revenue, or actual utilization.
- Evidence: `operator-full-feed-top.png`/`.xml`, `operator-full-feed-bars.png`/`.xml`, and `operator-full-feed-disclosure.png`/`.xml`; the post-flow fatal/ANR scan was clean.

## Current location and nearby-stop discovery

- Installed the location-enabled APK with both location permissions initially revoked, then opened the planner and tapped `Find nearby boarding stops`.
- Verified the native Android precise/approximate permission dialog. Selecting `Don't allow` returned to the planner with an explicit manual-search fallback and no blocked controls.
- Granted the permissions for the positive platform-fix path. The app acquired a device location with 70 m reported accuracy and queried the indexed stop API.
- The physical position was outside the five-kilometre feed radius, so the app honestly displayed the no-covered-stop fallback. A real-index API test separately verifies ordered, distance-labelled nearby results around Kempegowda Bus Station.
- Evidence: `location-permission.png`/`.xml`, `location-denied.xml`, and `location-nearby-5km.png`/`.xml`; the post-flow fatal/ANR scan was clean.
