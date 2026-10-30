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
