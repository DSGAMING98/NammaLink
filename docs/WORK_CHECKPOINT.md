# Work Checkpoint

Updated: 30 October 2026

## Current phase

Phase 13 — Verified continuous integration and release hardening.

## Last completed task

Verified the complete GitHub Actions pipeline on `main`: all web/data tests, strict type-check, production web build, native Android build, checksum step, and retained APK artifact passed against the pushed commit.

## Last verified working commit

CI milestone: `5b6226f` on `main`, verified by GitHub Actions run `41006581144`. The Android network-client integration is build-verified; connected UI validation still awaits an unlocked handset.

## Completed features

- Secret-safe blank environment template; local secrets remain ignored.
- Dataset audit and provenance/licence/readiness inventory.
- ODbL-attributed 3-route, 216-stop, 53-trip BMTC demonstration fixture.
- Calendar-aware schedule routing with hard arrive-by, walking, transfer, and directness constraints.
- Multiple ranking strategies, source-labelled timeline, evidence-aware simulated incident, and recovery preserving the completed leg.
- Installable responsive web app with offline shell, saved journey, local report queue, and schedule-supply operator insights.
- 28 passing web/router/API/operator tests plus strict type-check and production build.
- Native Kotlin/Jetpack Compose project using AGP 9.2.1, Gradle 9.4.1, compile/target SDK 36, and minimum SDK 26.
- Native constraint planner, GTFS-derived demonstration itinerary, schematic route view, locally persisted saved journey, explicit simulated disruption/recovery, and operator screen.
- Physical Android 16 installation and UI-hierarchy validation on Vivo V2513.
- Device screenshots under `research_outputs/device_evidence/`.
- Machine-readable zero-model registry and professional ML artifact/evidence policy in `docs/ML_TRAINING_REPORT.md`.
- Operator UI explicitly reports zero trained ML models instead of fabricating evaluation metrics.
- Reproducible 9,960-stop compact BMTC index and `/api/stops` endpoint with normalized token search, result limits, and embedded provenance.
- Full 57,836-trip BMTC Connection Scan index with 1,477,697 admitted connections, 5,153 recorded plausibility rejections, three-minute inter-trip transfer buffer, and exact path reconstruction.
- `/api/network-journeys` date/stop/time validation, feed-window enforcement, provenance, schedule-only flag, and measured query latency.
- Android debounced stop autocomplete, injectable backend URL, city-scale journey parsing/rendering, explicit request errors, and separately selected offline fallback.
- Website Android download section and repository-hosted 17.15 MB development APK, explicitly labelled debug-signed with SHA-256.
- Full-feed operator supply graph with 9,960 stops, 57,836 trips, 4,416 route records, 1,477,697 admitted connections, and top-eight route trip bars.
- GitHub Actions verification for tests, type-check, production web build, native Android build, APK checksum, and 14-day APK artifact retention.
- Fail-closed Android release signing configuration: production packaging requires four external environment values and a readable keystore; signing files are ignored by Git.

## Incomplete features

Arbitrary place search/maps, spatial nearest-stop indexing, persistent server-side disruption reporting/moderation, authentication, notifications, legitimately trained ML, secure release signing, and public backend deployment remain incomplete. Full-feed Android integration is implemented and build-verified but still requires connected UI validation on the locked handset.

## Verification evidence

- `npm run test:run`: passed, 22 tests across 9 files.
- Stop-search milestone test total: passed, 24 tests across 10 files.
- Full-network routing milestone: passed, 27 tests across 11 files.
- Full-feed operator graph milestone: passed, 28 tests across 12 files.
- `npm run typecheck`: passed.
- `npm run build`: passed with static `/` and dynamic `/api/journeys` and `/api/recovery` routes.
- Browser desktop/mobile journey, recovery, low-connectivity, and operator flows: passed in prior milestones.
- Android `:app:assembleDebug`: passed on JDK 21 with SDK 36.
- ADB streamed install: passed on connected Vivo V2513 running Android 16/API 36.
- Device process/activity focus: passed; `in.nammalink.app/.MainActivity` visible and focused.
- Planner UI hierarchy: passed for origin, destination, arrive-by, ranking, walking, and plan action.
- Journey UI hierarchy: passed for deadline, static-GTFS evidence, timeline, native schematic, and recovery action.
- Saved journey persistence: passed; `Saved ✓` remained after force-stop and clean relaunch.
- Simulated recovery interaction: passed; route changed from 365 to 500-D and recovery path was visually distinguished.
- Operator UI hierarchy: passed for 53 trips, 216 stops, 3 routes, zero trained models, and evidence-gate explanation.
- Device log scan: passed; no NammaLink fatal exception or ANR found.
- Verified debug APK SHA-256: `BF3640B973F1E89E922ED0ED92D288B482FDE3F97F57D358DC4CEFC007136378`.
- Full-feed production query: Kempegowda Bus Station 08:00 → Central Silk Board 08:50 with one six-minute transfer; repeated warm scans measured 205–256 ms.
- Out-of-validity query: correctly returned HTTP 422.
- Updated Android `:app:assembleDebug`: passed with the stop-search and network-journey client.
- `adb reverse tcp:3000 tcp:3000`: configured successfully; updated APK streamed install passed.
- Production website APK check: HTTP 200, `application/vnd.android.package-archive`, 17,150,016-byte content length, visible debug-signing label.
- Current development APK SHA-256: `1F4DBCE3A07E69EF9719B268EF9EDEEEBDCE2E99FE17895D7ABD3197DE501356`.
- Operator graph production HTML: passed for all full-feed totals, rejection count, and zero-model label.
- Operator graph visual QA: passed in the in-app browser at desktop and 390×844 mobile viewport; cards, bars, disclaimers, and following download section rendered without observed overflow.
- CI command parity check: frozen pnpm install, 28 tests, strict type-check, and production build passed locally before workflow push.
- GitHub Actions run [`41006581144`](https://github.com/DSGAMING98/NammaLink/actions/runs/41006581144): both `Web, routing, and data tests` and `Native Android APK` completed successfully for commit `5b6226fbaf16ae5d2c0f1fbb83365503fd856c93`.
- CI Android artifact `NammaLink-android-debug-5b6226fbaf16ae5d2c0f1fbb83365503fd856c93`: 9,947,921-byte ZIP retained until 2026-11-13; GitHub artifact digest `sha256:2a5a2c02c6f4793e1209bc3cfdccdd8c9ce7dcf907cee5967bd620aa0df6ce1e`.
- Release-safety verification: `:app:assembleRelease` without credentials failed at `verifyReleaseSigning` with the expected four-variable message, including on a reused Gradle configuration cache; `:app:assembleDebug` still passed.

## Dataset and ML limitations

- BMTC and BMRCL feeds are unofficial static community feeds.
- No authorized realtime transit feed or verified disruption feed is available.
- No labelled historical actual-arrival/delay dataset has passed validation.
- BMRCL intermediate times are modelled; BMTC coverage/coordinates still require broader outlier handling.
- No ML model has been trained. Static schedule values must not be reused as prediction labels.

## External blockers

- Google Places minimal probes returned HTTP 403; API enablement, billing, or key restrictions remain unresolved.
- Supabase schema/access has not been verified.
- Secure release signing is not configured. A clearly labelled debug-signed development APK is publicly available from the repository-backed website surface, but the network backend itself is not publicly deployed.
- The connected Vivo handset is securely locked, so updated autocomplete/button UI validation requires the owner to unlock it; ADB authentication bypass was not attempted.

## Exact next implementation step

After the handset is unlocked, validate autocomplete and full-network journey rendering over `adb reverse` and capture device evidence. Then replace the clearly labelled development APK with a securely release-signed artifact. Do not repeat the completed backend, Android integration, or download-surface work.

## Restore commands

```powershell
Set-Location 'C:\Users\Prajwal\Desktop\Alliance Hackathon\NammaLink'
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
