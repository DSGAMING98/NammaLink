# Work Checkpoint

Updated: 30 October 2026

## Current phase

Engineering phases 27–31 — production connectivity, deployment package, API gateway, reliability, and release pipeline.

## Last completed task

Implemented the production health/version contract, server-only Google gateway, normalized failures, request IDs, rate limits, timeouts, standalone/container deployment package, secret hygiene gate, Android service-readiness flow, and fail-closed presentation/release endpoint policy. Physical Android QA passed for both service-ready and backend-unavailable states without a fatal exception or ANR.

## Last verified working commit

Engineering milestone `49b66b2` on `main`, fully verified by GitHub Actions run `41086371223`. Local and hosted verification pass: 53 tests, secret hygiene, strict type-check, production build/standalone smoke, debug APK, presentation APK, endpoint guards, and physical-device readiness/degraded-mode QA.

## Current branch

`main`, tracking `origin/main`.

## Completed features

- Secret-safe blank environment template; local secrets remain ignored.
- Dataset audit and provenance/licence/readiness inventory.
- ODbL-attributed 3-route, 216-stop, 53-trip BMTC demonstration fixture.
- Calendar-aware schedule routing with hard arrive-by, walking, transfer, and directness constraints.
- Multiple ranking strategies, source-labelled timeline, evidence-aware simulated incident, and recovery preserving the completed leg.
- Installable responsive web app with offline shell, saved journey, local report queue, and schedule-supply operator insights.
- 47 passing web/router/API/operator/calendar/contract/location tests plus strict type-check and production build.
- Native Kotlin/Jetpack Compose project using AGP 9.2.1, Gradle 9.4.1, compile/target SDK 36, and minimum SDK 26.
- Native constraint planner, GTFS-derived demonstration itinerary, schematic route view, versioned full-itinerary local save/restore, explicit simulated disruption/recovery, and full-feed operator screen.
- Physical Android 16 installation and UI-hierarchy validation on Vivo V2513.
- Android on-demand precise/approximate location permission, current-fix acquisition, distance-ranked nearby-stop lookup, denial-safe manual search, and outside-feed fallback.
- Native geographic projection from real boarding/transfer/alighting coordinates with bus/Metro/walk colours and explicit straight-line limitations.
- Map legend, mode-coloured timeline markers, and privacy-preserving current-fix context that remains in memory only and does not alter saved journeys.
- Optional current-location access leg with budget reservation, door-time calculation, and evidence-backed over-budget rejection.
- Timetable-derived duration/waiting and safest/fastest/direct recommendation reasoning, with an explicit static-schedule evidence boundary and offline persistence.
- Feasible same-request contract comparison with actual duration, waiting, changes, and walking plus leg-level scheduled-wait cards.
- Selectable full-itinerary alternatives that remain switchable after save, backend disconnection, force-stop, and relaunch.
- Device screenshots under `research_outputs/device_evidence/`.
- Machine-readable zero-model registry and professional ML artifact/evidence policy in `docs/ML_TRAINING_REPORT.md`.
- Operator UI explicitly reports zero trained ML models instead of fabricating evaluation metrics.
- Reproducible 10,043-stop BMTC + BMRCL search index with station/platform normalization, mode labels, result limits, and embedded provenance.
- Calendar-filtered 61,115-trip multimodal Connection Scan index with 1,563,324 admitted connections, 670 explicit transfer footpaths, 5,153 recorded plausibility rejections, three-minute inter-trip buffer, and exact ride/walk reconstruction.
- `/api/network-journeys` date/stop/time/contract validation, depart-after and arrive-by search, hard walking budgets, safest/fastest/direct behavior, feed-window enforcement, provenance, schedule-only flag, and measured query latency.
- Android debounced stop autocomplete, injectable backend URL, depart-after/arrive-by selection, enforced priority/walking controls, city-scale journey parsing/rendering, explicit request errors, and separately selected offline fallback.
- Website Android download section and repository-hosted 7.03 MB presentation APK, explicitly labelled with its debug certificate, HTTPS backend, and SHA-256.
- Full-feed operator supply graph with 10,043 searchable stops, 61,115 trips, 4,419 route records, 1,563,324 admitted connections, and top-eight route trip bars.
- GitHub Actions verification for tests, type-check, production web build, native Android build, APK checksum, and 14-day APK artifact retention.
- Fail-closed Android release signing configuration: production packaging requires four external environment values and a readable keystore; signing files are ignored by Git.
- Physical-device validation of live bus/Metro autocomplete, bus-only routing, Metro-only routing, mixed BMTC–walk–BMRCL routing, direct routing, and arrive-by deadline planning over the USB-forwarded backend.

## Incomplete features

Arbitrary place search/maps, coordinate-based access/egress, pedestrian-network geometry, city-scale multi-label Pareto alternatives, persistent server-side disruption reporting/moderation, authentication, notifications, legitimately trained ML, and store-grade release signing remain incomplete.

## Verification evidence

- `npm run test:run`: passed, 22 tests across 9 files.
- Stop-search milestone test total: passed, 24 tests across 10 files.
- Full-network routing milestone: passed, 27 tests across 11 files.
- Full-feed operator graph milestone: passed, 28 tests across 12 files.
- Multimodal/calendar milestone: passed, 36 tests across 14 files, including real indexed Metro and mixed-mode API queries.
- City-scale contract milestone: passed, 38 tests across 14 files, including walking-budget adaptation, direct-only routing, invalid-contract rejection, and physical-device UI evidence.
- City-scale arrive-by milestone: passed, 40 tests across 14 files, including latest-feasible-departure search, mutually exclusive time-mode validation, and real indexed deadline queries.
- `npm run typecheck`: passed.
- `pnpm build`: passed with the static web app and all journey, recovery, stop-search, and full-network API routes.
- Browser desktop/mobile journey, recovery, low-connectivity, and operator flows: passed in prior milestones.
- Android `:app:assembleDebug`: passed on JDK 21 with SDK 36.
- ADB streamed install: passed on connected Vivo V2513 running Android 16/API 36.
- Device process/activity focus: passed; `in.nammalink.app/.MainActivity` visible and focused.
- Planner UI hierarchy: passed for origin, destination, arrive-by, ranking, walking, and plan action.
- Journey UI hierarchy: passed for deadline, static-GTFS evidence, timeline, native schematic, and recovery action.
- Saved journey persistence: passed; `Saved ✓` remained after force-stop and clean relaunch.
- Simulated recovery interaction: passed; route changed from 365 to 500-D and recovery path was visually distinguished.
- Operator UI hierarchy: passed for 10,043 searchable stops, 61,115 trips, 4,419 route records, 1,563,324 connections, 670 footpaths, 5,153 rejected connections, zero trained models, and exact top-eight route trip counts.
- Device log scan: passed; no NammaLink fatal exception or ANR found.
- Verified debug APK SHA-256: `BF3640B973F1E89E922ED0ED92D288B482FDE3F97F57D358DC4CEFC007136378`.
- Full-feed production query: Kempegowda Bus Station 08:00 → Central Silk Board 08:50 with one six-minute transfer; repeated warm scans measured 205–256 ms.
- Out-of-validity query: correctly returned HTTP 422.
- Updated Android `:app:assembleDebug`: passed with the stop-search and network-journey client.
- `adb reverse tcp:3000 tcp:3000`: configured successfully; updated APK streamed install passed.
- Production website APK check: HTTP 200, `application/vnd.android.package-archive`, 17,150,016-byte content length, visible debug-signing label.
- Archived development APK SHA-256: `EBFA83535D5471B8BCB91EC484E7AFB8FC6574A14181C24307B09B735228EEB8` (17,150,016 bytes).
- Operator graph production HTML: passed for all full-feed totals, rejection count, and zero-model label.
- Operator graph visual QA: passed in the in-app browser at desktop and 390×844 mobile viewport; cards, bars, disclaimers, and following download section rendered without observed overflow.
- CI command parity check: frozen pnpm install, 36 tests, strict type-check, production web build, and native Android debug build passed locally before workflow push.
- GitHub Actions run [`41006581144`](https://github.com/DSGAMING98/NammaLink/actions/runs/41006581144): both `Web, routing, and data tests` and `Native Android APK` completed successfully for commit `5b6226fbaf16ae5d2c0f1fbb83365503fd856c93`.
- CI Android artifact `NammaLink-android-debug-5b6226fbaf16ae5d2c0f1fbb83365503fd856c93`: 9,947,921-byte ZIP retained until 2026-11-13; GitHub artifact digest `sha256:2a5a2c02c6f4793e1209bc3cfdccdd8c9ce7dcf907cee5967bd620aa0df6ce1e`.
- Release-safety verification: `:app:assembleRelease` without credentials failed at `verifyReleaseSigning` with the expected four-variable message, including on a reused Gradle configuration cache; `:app:assembleDebug` still passed.
- Release-hardening GitHub Actions run [`41007074104`](https://github.com/DSGAMING98/NammaLink/actions/runs/41007074104): web/data and native Android jobs both passed for commit `bdac2ccec2ea19fb5e16e1e4436ad7dbfb931989`.
- Release-hardening CI artifact `NammaLink-android-debug-bdac2ccec2ea19fb5e16e1e4436ad7dbfb931989`: 9,947,922-byte ZIP retained until 2026-11-13; GitHub artifact digest `sha256:a561a0e3efa84800a0d2ecf8c21ae2e43f2655b41071d523e8155a176f8cea48`.
- Physical Android autocomplete: `kempe` returned indexed Kempegowda Arch and Kempegowda Bus Station matches with real BMTC stop IDs; PNG/XML evidence saved under `research_outputs/device_evidence/`.
- Physical Android full-network journey: 08:00 Kempegowda Bus Station → 08:50 Central Silk Board, one transfer, routes `316-B` and `G-3 SJSCBSE-CSB`, 175 ms measured server scan, and schedule-only disclosure rendered correctly.
- Post-flow device log scan: no `FATAL EXCEPTION`, NammaLink ANR, or AndroidRuntime fatal match.
- Unified index regeneration: 10,043 searchable stops, 10,213 routing nodes, 61,115 trips, 1,563,324 connections, and 670 directed transfer footpaths.
- GTFS calendar evidence: Friday 2026-10-30 activated 58,737 trips; Sunday 2026-11-01 activated 58,451 trips.
- Physical Metro journey: Whitefield 08:00 → Challaghatta 09:20, Purple Line, 36 stops, 52 ms measured scan.
- Physical mixed journey: 14th Main HSR Layout 08:02 → Whitefield Metro 09:15 using `V-500E ELCKIA-HBLB`, `500-F`, a 128 m estimated walk, and Purple Line; 48 ms measured scan.
- Updated APK streamed installation and mixed-mode UI hierarchy passed; post-flow fatal/ANR scan remained clean.
- Reproducibility rerun produced byte-identical artifacts: stop index SHA-256 `4A76778C271D7084BBA69910E861F3AFABD9E9992D6521D6A94C77F9FA260FE8`, metadata `6A1C0214E3E1317A55EE69FE1BD7879D4196758C993A7C86D270935E00306CB1`, and binary gzip `8261A316CA1C358343658908A1C5A957477A82A9548571F9B1020A318049EB42`.
- GitHub Actions run `41036767610`: web/routing/data tests, strict type-check, production build, native APK build, checksum recording, and artifact upload all passed; artifact `12968352261` is retained for 14 days.
- Real-index walking-budget adaptation: the 400 m HSR Layout → Whitefield result used a 128 m SAP Labs transfer; a 100 m contract selected an alternate 83 m Kundalahalli Metro Station transfer and still arrived at 09:15.
- Physical direct-contract journey: Kempegowda Bus Station 09:55 → Central Silk Board 10:42 on `348-C`, 0 transfers, 0/400 m walking, 53 ms; screenshot/UI hierarchy captured and fatal/ANR scan clean.
- GitHub Actions run `41037654792`: all 38 tests, strict type-check, production web build, native APK build, checksum recording, and artifact upload passed for `480a030`; artifact `12969365276` is retained until 13 November 2026.
- Real-index Metro arrive-by query: Whitefield 08:00 → Challaghatta 09:20 for a 09:30 deadline; latest start 08:00, 11 scans, 598 ms measured locally.
- Physical arrive-by journey: latest start 10:10 for an 11:00 Kempegowda Bus Station → Central Silk Board deadline, arrival 10:42, 0/400 m walking, 859 ms; screenshot/UI hierarchy captured and fatal/ANR scan clean.
- GitHub Actions run `41046438069`: all 40 tests, strict type-check, production web build, native APK build, checksum recording, and artifact upload passed for `be13ffd`; artifact `12972746779` is retained until 13 November 2026.
- Physical offline restoration: versioned full-network journey payload stored, USB backend reverse removed, app force-stopped/relaunched, and the exact two-leg 08:00–08:50 itinerary restored with `Saved ✓`; fatal/ANR scan clean.
- GitHub Actions run `41047408362`: all 40 tests, strict type-check, production web build, native APK build, checksum recording, and artifact upload passed for `e0bb4fe`; artifact `12972304582` is retained until 13 November 2026.
- Physical native operator graph: full-feed totals, zero-model evidence gate, all eight count-labelled route bars, and the supply-only disclaimer rendered on the Vivo V2513; screenshot/UI hierarchy evidence captured and fatal/ANR scan clean.
- GitHub Actions run [`41048063190`](https://github.com/DSGAMING98/NammaLink/actions/runs/41048063190): all 40 tests, strict type-check, production web build, native APK build, checksum recording, and artifact upload passed for `ee56602`.
- CI Android artifact `NammaLink-android-debug-ee5660240adaa3a34f8391f6b7e85aad4aea0ebb` (`12972584369`): 9,958,927-byte ZIP retained until 13 November 2026; GitHub artifact digest `sha256:793ee327fd22dd239808b10a07a4be03fa0a23a44fd6927e2db7891d7051c0e6`.
- Nearby-stop API verification: real-index positive query returned distance-ordered stops; incomplete/out-of-range coordinates returned HTTP 400; great-circle, radius, limit, and hidden-platform behavior passed unit coverage.
- Physical Android location flow: system permission dialog rendered, denial retained manual search, permission grant produced a 70 m reported-accuracy fix, and the outside-five-kilometre state rendered without inventing stop coverage; fatal/ANR scan clean.
- GitHub Actions run [`41049023651`](https://github.com/DSGAMING98/NammaLink/actions/runs/41049023651): all 45 tests, strict type-check, production web build, native APK build, checksum recording, and artifact upload passed for `a02fdc3`.
- CI Android artifact `NammaLink-android-debug-a02fdc3fb1801a767bb4368512a0f7292074c87c` (`12973302879`): 9,970,818-byte ZIP retained until 13 November 2026; GitHub artifact digest `sha256:110e0e34672b730282807126075a5d170dbbe6905e96aa0607a7bba8368b7617`.
- Physical geographic fallback: real 08:00–08:50 route endpoints and transfer projected cleanly; coordinate-bearing storage version 2 restored the same map and both route legs after backend reverse removal plus force-stop/relaunch; fatal/ANR scan clean.
- GitHub Actions run [`41049872986`](https://github.com/DSGAMING98/NammaLink/actions/runs/41049872986): all 45 tests, strict type-check, production web build, native APK build, checksum recording, and artifact upload passed for `7bd5a45`.
- CI Android artifact `NammaLink-android-debug-7bd5a453f7156e68cf1edddf6acc4d78a37309d9` (`12974331673`): 9,975,891-byte ZIP retained until 13 November 2026; GitHub artifact digest `sha256:ceb2c95b3f984b057cce316f82390ae77c887169692afeb7a1866b08c95a4001`.
- Physical multimodal map: two BMTC legs, a 128 m estimated walk, and Purple Line rendered with consistent green/amber/purple map and timeline colours; current fix outside the route was disclosed as session-only; scroll state opened at the journey header; fatal/ANR scan clean.
- GitHub Actions run [`41050897769`](https://github.com/DSGAMING98/NammaLink/actions/runs/41050897769): all 45 tests, strict type-check, production web build, native APK build, checksum recording, and artifact upload passed for `5469f7e`.
- CI Android artifact `NammaLink-android-debug-5469f7e0c4ffa6689cedbe86e6d59afa15e66090` (`12975130370`): 9,983,918-byte ZIP retained until 13 November 2026; GitHub artifact digest `sha256:6e20c4157a4c3764c248e40ac85c99a834cb274166d04c8e5b912b8808d486e2`.
- GitHub Actions run [`41051675350`](https://github.com/DSGAMING98/NammaLink/actions/runs/41051675350): all 47 tests, strict type-check, production web build, native APK build, checksum recording, and artifact upload passed for `ff54502`.
- CI Android artifact `NammaLink-android-debug-ff54502bce82a3b8c50d3f8dc488280b30393cac` (`12974733008`): 9,985,170-byte ZIP retained until 13 November 2026; GitHub artifact digest `sha256:9cf172d1c3d5f34ed1b6dc8addf1dea8b070c74fd27a0dae02bdff10c4a47419`.
- GitHub Actions run [`41052819731`](https://github.com/DSGAMING98/NammaLink/actions/runs/41052819731): all 47 tests, strict type-check, production web build, native APK build, checksum recording, and artifact upload passed for `a5998fc`.
- CI Android artifact `NammaLink-android-debug-a5998fce5f11d6be4c8b15c9c892a331bd2cbf62` (`12974219715`): 9,987,995-byte ZIP retained until 13 November 2026; GitHub artifact digest `sha256:1c728c7a10e9022563e8bbaf60d69812413f85b289f083520073ef69afb0a129`.
- GitHub Actions run [`41053824571`](https://github.com/DSGAMING98/NammaLink/actions/runs/41053824571): all 47 tests, strict type-check, production web build, native APK build, checksum recording, and artifact upload passed for `d9e27c2`.
- CI Android artifact `NammaLink-android-debug-d9e27c25d5388938b8e3b8350a6c888caef56402` (`12975707017`): 9,994,223-byte ZIP retained until 13 November 2026; GitHub artifact digest `sha256:73ecfb9f5d9ce9ba48eb56989b6ada2bd147d17e740199099d2ec21a6cf20acd`.
- GitHub Actions run [`41054502414`](https://github.com/DSGAMING98/NammaLink/actions/runs/41054502414): all 47 tests, strict type-check, production web build, Android build, checksum recording, and artifact upload passed for `f13c756`.
- CI Android artifact `NammaLink-android-debug-f13c756c9683b24c507f14383b857a3c9d467e6a` (`12975933689`): 9,997,047-byte ZIP retained until 13 November 2026; GitHub artifact digest `sha256:c00a7cb80f95b52ef20461e2e9468a78dbeee745b711fd0000fb6e243af4d8f8`.
- Access-contract API smoke: 116 m access under an 800 m maximum left 684 m, separated door/stop/boarding times, and a 2,447 m access under a 100 m maximum returned no journey with explicit evidence.
- Physical manual-stop regression: unchanged `0/800 m walk`, no injected current-location leg, updated APK install successful, and fatal/ANR scan clean.
- Recommendation API smoke: default safest journey returned 3,000 seconds total duration and 360 seconds scheduled waiting; a fastest Metro journey returned 4,800 seconds total duration and zero scheduled waiting.
- Physical recommendation result: `50 min journey · 6 min scheduled waiting`, protected-transfer title, three-minute transfer rule, walking-cap evidence, and non-live disclaimer rendered; schema-version-3 offline restoration retained every field after backend removal; fatal/ANR scan clean.
- Physical contract comparison: safest and fastest were identical 08:00–08:50 results; direct was honestly shown as 08:00–10:42 with 162 minutes total and 115 minutes waiting; the selected itinerary exposed its 08:09–08:15 connection wait; schema-version-4 offline restoration retained the comparison; fatal/ANR scan clean.
- Physical selectable alternatives: Direct switched to the full `348-C` result and explicit 115-minute initial wait; schema-version-5 restored Direct with the backend disconnected, then switched offline to the complete Safest itinerary; fatal/ANR scan clean.

- Engineering foundation GitHub Actions run [`41086371223`](https://github.com/DSGAMING98/NammaLink/actions/runs/41086371223): secret hygiene, all 53 tests, strict type-check, production build, standalone health/stop smoke tests, debug APK, public-endpoint fail-closed test, presentation APK, checksum, and artifact upload all passed for `49b66b2`.
- CI Android artifact `NammaLink-android-debug-49b66b27109d88a7a0f8de0b812f81587ac6de42` (`12992151752`): 10,002,974-byte ZIP retained until 13 November 2026; digest `sha256:073cd8da8ed911629c3d58d579348682b31f7047a7bb859f84a9bb057efd6cd8`.
- Vercel production deployment `dpl_AGv3WmmXkYTuJ6u3GeLKh7jHmFXV` reached READY at `https://nammalink.vercel.app` from commit `896bbfc`; unauthenticated health returned revision `896bbfc`, Majestic search returned indexed bus/Metro stops, and the public journey API returned Kempegowda Bus Station 08:00 → Central Silk Board 08:50 with two rides.
- Presentation APK `0.1.0-presentation` was compiled against the public HTTPS origin: 7,028,336 bytes, SHA-256 `45CFEA744CE361383947BCF8F67D2E1CFD53C101622A026E98DE1A613EA5E3E2`.
- Physical Vivo V2513 acceptance passed with zero ADB reverse entries: service revision `896bbfc` rendered, Majestic autocomplete returned Kempegowda Bus Station and Nadaprabhu Kempegowda Station Metro, full-network journey planning rendered, and no presentation-app fatal exception or ANR was found.

## Dataset and ML limitations

- BMTC and BMRCL feeds are unofficial static community feeds.
- No authorized realtime transit feed or verified disruption feed is available.
- No labelled historical actual-arrival/delay dataset has passed validation.
- BMRCL intermediate times are modelled; BMTC coverage/coordinates still require broader outlier handling.
- No ML model has been trained. Static schedule values must not be reused as prediction labels.

## External blockers

- Google Routes and Geocoding probes pass. Places Autocomplete returns HTTP 403 because the configured key blocks server requests without an HTTP referrer; its restriction must be corrected or a server key supplied.
- Supabase schema/access has not been verified.
- Store-grade release signing is not configured. The presentation APK is intentionally signed with Android's debug certificate; the public network backend is deployed and verified.
- Vercel production is live. The connector's runtime-error aggregation endpoint returns HTTP 403 for the personal scope, so deeper platform-log inspection requires an additional observability permission.

## Known bugs and coverage gaps

- The native fallback uses real stop coordinates and can show a session-only current-fix marker near the plotted route, but still lacks street-following transit shapes, pedestrian geometry, map tiles, and pan/zoom.
- Access distance uses straight-line geometry and a fixed 1.25 m/s walking speed; pedestrian-network routing remains unavailable.
- The connected phone's physical location was outside the five-kilometre indexed-stop radius, so the positive nearby-result UI is API-tested but not physically exercised at an in-coverage location.
- Full-network planning requires a reachable backend unless an already-saved journey or the explicit bounded offline demonstration is used.

## Deployment state

Production is live at `https://nammalink.vercel.app`. The standalone build, `/api/health`, stop search, journey planning, presentation APK, public-HTTPS guard, and no-USB-tunnel physical-phone gate pass. A store-release-signed APK separately requires the owner-held signing key; the current presentation APK uses Android's debug certificate and is suitable for the MVP presentation.

## Uncommitted work

None. Engineering phases 27–31 are committed and pushed. Device evidence is saved under `research_outputs/device_evidence/nammalink-engineering-*`.

## Exact next implementation step

Begin Phase 32 feature work: Google place/map integration and airport mode. Before enabling Places Autocomplete in production, correct the supplied Places key's server restriction and add the server-only Google variables to the new Vercel project.

## Restore commands

```powershell
Set-Location 'C:\path\to\NammaLink'
git status --short --branch
git pull --ff-only origin main
npm run test:run
npm run typecheck
npm run build

Set-Location android
$env:JAVA_HOME = 'D:\Android Studio\jbr'
$env:ANDROID_HOME = 'C:\Users\Prajwal\AppData\Local\Android\Sdk'
.\gradlew.bat :app:assembleDebug
```
