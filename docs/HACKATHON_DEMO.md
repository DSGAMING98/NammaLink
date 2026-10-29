# Hackathon demonstration

## One-sentence concept

NammaLink finds a schedule-supported public-transport journey that respects the passenger's deadline, walking, and transfer limits, then recovers the unfinished trip when a connection breaks.

## Setup

```powershell
git clone https://github.com/DSGAMING98/NammaLink.git
Set-Location NammaLink
npm install
npm run test:run
npm run dev
```

Open `http://localhost:3000`. The core demo needs no API key.

## Five-minute flow

1. Introduce the fixed route: Jain University, Jakkasandra to Alliance University, Central Campus.
2. Show the Journey Contract: arrive by 10:05, walk at most 800 m, at most one transfer, fastest priority.
3. Select **Find verified options**.
4. Explain the scheduled result: leave at 06:39, board `O EXP V-213VJ` at Jain University Gate, transfer at Banashankari to `600-CA`, alight at Chikka Hagade Gate, arrive around 09:58.
5. Point out 5 minutes scheduled waiting, 757 m estimated walking, one transfer, feed version, and the `Scheduled` label.
6. Change priority to **Direct only** and show the honest no-direct-result state if desired; restore the original search afterward.
7. Select **Simulate a missed connection** on the recommended journey.
8. Point out the orange `Simulation · not a real disruption` label.
9. Explain that the first leg remains completed, the affected second trip is removed, and the original 10:05 deadline is now at risk.
10. Show the actionable continuation: replan at 08:00, board the next `600-CA` at 08:45, arrive around 10:38.
11. Queue the report locally and note that nothing is uploaded.
12. Scroll to Transit Operations Insights and show the schedule-supply metrics without claiming occupancy or real fleet efficiency.

## Judge questions

**Is this live tracking?** No. It is a source-labelled static schedule baseline. No authorized realtime feed was found.

**Why not train ML?** No labelled observed arrivals exist. The project documents the required schema and keeps a deterministic baseline until MAE/RMSE can be measured honestly.

**Why is the trip so long?** The selected campuses are far apart and the bounded feed verifies a Banashankari transfer. The system optimizes actual schedule feasibility, not road distance.

**Does a direct bus exist?** None exists in the committed three-route fixture. The app reports that coverage gap rather than generalizing to all current BMTC services.

**How is recovery different from restarting a search?** It preserves the completed first leg, replans from the current transfer point/time, excludes the affected trip, and checks the original contract before relaxing anything.

**What works offline?** The app shell, last saved journey, connection indicator, and local report draft. Live alerts, new route calculations, and Google map tiles do not continue offline.

## Evidence

- `npm run test:run`: 22 tests across 9 files at this checkpoint.
- `npm run typecheck`: strict TypeScript pass.
- `npm run build`: production build pass.
- Browser QA: desktop and 390×844 journey flow, recovery flow, local queue, saved-journey restore, and operator section.
- Dataset and limitations: `docs/DATASET_INVENTORY.md`.
- Metrics: `docs/EVALUATION_RESULTS.md`.
