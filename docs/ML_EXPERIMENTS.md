# Machine-learning experiments

Last updated: 29 October 2026

## Decision

No supervised delay model was trained.

The audited datasets contain static schedules and historical aggregate Metro ridership, but no timestamped observed vehicle arrivals linked to trip, stop, and scheduled time. There is therefore no legitimate arrival-delay target for train/validation/test evaluation. Training a regression model on synthetic labels or reporting accuracy against schedules would be misleading.

## Implemented baseline

The application uses a deterministic schedule-only ETA baseline:

- GTFS arrival and departure times;
- explicit access, transfer, and egress walking time;
- scheduled wait between legs;
- no learned delay adjustment; and
- source label `scheduled` on every result.

This baseline can later be evaluated with MAE and RMSE once genuine observations exist.

## Required observation schema

| Field | Purpose |
| --- | --- |
| `operator_id`, `route_id`, `trip_id` | Stable service identity |
| `stop_id`, `stop_sequence` | Target location and order |
| `scheduled_arrival` | Baseline timestamp |
| `observed_arrival` | Label timestamp from an authorized source |
| `observation_source`, `accuracy`, `recorded_at` | Provenance and quality |
| `service_date`, `direction_id` | Time-aware split and grouping |

Observations require validity checks, duplicate handling, timezone normalization, outlier review, and a clear lawful source. Passenger GPS must be opt-in and must not reveal other passengers.

## Future experiment protocol

1. Freeze a versioned observation dataset and route holdout.
2. Compare schedule-only, historical median, linear regression, and random forest baselines.
3. Use chronological validation and a final untouched test period.
4. Report MAE/RMSE overall and by route, stop sequence, time band, and horizon.
5. Inspect leakage from recent observations and scheduled duration.
6. Add XGBoost/LightGBM only if baselines and dataset size justify them.
7. Ship a model only when it beats the deterministic baseline consistently and exposes confidence/source information.

Deep sequence or graph models are not justified until data volume, coverage, and measured benefit support their operational cost.

## Missed-connection risk

The current recovery engine uses transparent feasibility rules rather than a learned probability. A future probabilistic baseline can combine arrival uncertainty, transfer walk, minimum boarding buffer, and connection departure, but it must be calibrated on observed missed/made connections.
