# Work Checkpoint

Updated: 30 October 2026

## Current phase

Phase 11 — Native Android MVP and physical-device validation.

## Last completed task

Built the first genuine Kotlin/Jetpack Compose Android APK, installed it on an authorized Vivo Android 16 phone, and verified planner, journey, persistence, simulated recovery, and operator evidence flows without a crash or ANR.

## Last verified working commit

Verified native Android milestone: `ecc34ed` on `main`. The compact stop-search milestone follows this commit.

## Completed features

- Secret-safe blank environment template; local secrets remain ignored.
- Dataset audit and provenance/licence/readiness inventory.
- ODbL-attributed 3-route, 216-stop, 53-trip BMTC demonstration fixture.
- Calendar-aware schedule routing with hard arrive-by, walking, transfer, and directness constraints.
- Multiple ranking strategies, source-labelled timeline, evidence-aware simulated incident, and recovery preserving the completed leg.
- Installable responsive web app with offline shell, saved journey, local report queue, and schedule-supply operator insights.
- 22 passing web/router/API/operator tests plus strict type-check and production build.
- Native Kotlin/Jetpack Compose project using AGP 9.2.1, Gradle 9.4.1, compile/target SDK 36, and minimum SDK 26.
- Native constraint planner, GTFS-derived demonstration itinerary, schematic route view, locally persisted saved journey, explicit simulated disruption/recovery, and operator screen.
- Physical Android 16 installation and UI-hierarchy validation on Vivo V2513.
- Device screenshots under `research_outputs/device_evidence/`.
- Machine-readable zero-model registry and professional ML artifact/evidence policy in `docs/ML_TRAINING_REPORT.md`.
- Operator UI explicitly reports zero trained ML models instead of fabricating evaluation metrics.
- Reproducible 9,960-stop compact BMTC index and `/api/stops` endpoint with normalized token search, result limits, and embedded provenance.

## Incomplete features

Arbitrary place search/maps, full-feed preprocessing/spatial indexing, Android backend integration beyond the bounded offline demonstration, persistent server-side disruption reporting/moderation, authentication, notifications, legitimately trained ML, release signing/distribution, and deployment remain incomplete.

## Verification evidence

- `npm run test:run`: passed, 22 tests across 9 files.
- Stop-search milestone test total: passed, 24 tests across 10 files.
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

## Dataset and ML limitations

- BMTC and BMRCL feeds are unofficial static community feeds.
- No authorized realtime transit feed or verified disruption feed is available.
- No labelled historical actual-arrival/delay dataset has passed validation.
- BMRCL intermediate times are modelled; BMTC coverage/coordinates still require broader outlier handling.
- No ML model has been trained. Static schedule values must not be reused as prediction labels.

## External blockers

- Google Places minimal probes returned HTTP 403; API enablement, billing, or key restrictions remain unresolved.
- Supabase schema/access has not been verified.
- Release signing and a public APK host are not configured.

## Exact next implementation step

Build a date-specific compact trip/stop-time routing index for the full BMTC feed, benchmark it, and connect Android autocomplete to `/api/stops` with a bundled fallback. Do not repeat the completed native scaffold or stop-index work.

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
