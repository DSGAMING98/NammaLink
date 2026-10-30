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
