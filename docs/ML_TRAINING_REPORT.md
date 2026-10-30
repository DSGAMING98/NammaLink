# ML Training and Evaluation Report

Updated: 30 October 2026

## Executive result

NammaLink currently has **zero legitimately trained machine-learning models**. The available audited transport inputs are static schedules and route geometry; they do not contain validated, labelled actual-arrival or delay outcomes. Training a delay predictor on these files would make the target from the schedule itself and create circular, misleading metrics.

Accordingly:

- no model accuracy, MAE, RMSE, residual, feature-importance, station-wise, or time-wise metric is claimed;
- no training/validation loss curve is generated;
- no synthetic values are presented as observed transit performance;
- the operator interfaces show schedule-supply baselines and an explicit zero-model evidence gate.

This is an intentional evidence decision, not a failed training run. The machine-readable registry is at `research_outputs/model_registry.json`.

## Graph policy

When a model is legitimately trained, its run must create a versioned directory under `research_outputs/graphs/` and metrics under `research_outputs/metrics/`. The following outputs are required when supported by the estimator and dataset:

| Output | Requirement |
| --- | --- |
| Training vs validation loss | Only when the training framework exposes real per-epoch/per-iteration histories |
| Actual vs predicted | Required for held-out labelled regression predictions |
| Residual/error distribution | Required for held-out labelled predictions |
| Baseline vs model MAE/RMSE | Required; baseline and split must be identical to the model evaluation |
| Feature importance/explainability | Required when the model has a defensible native or post-hoc explanation method |
| Station-wise performance | Required where station sample sizes pass a documented minimum |
| Time-wise performance | Required across defensible time buckets with sample counts |

Every graph must be saved as PNG and SVG with labelled axes, units, sample sizes, split description, model/run identifier, and generation timestamp. Numerical values must also be saved as JSON and CSV. A graph that cannot be supported must be omitted with the reason recorded here.

## Current schedule baselines

The current operator charts describe only the bounded GTFS fixture:

- 3 selected demonstration routes;
- 53 scheduled trips;
- 216 covered stops;
- relative scheduled trip supply by route.

These values are not punctuality, ridership, utilization, or prediction quality. They are computed schedule descriptors and are labelled that way in both the web and Android operator screens.

## Admission criteria for the first model

A delay model may be trained only after a candidate dataset passes all of the following:

1. Observed arrival/departure timestamps are distinct from scheduled timestamps.
2. Route, trip, stop, service date, and timezone can be resolved consistently.
3. Licence permits the intended processing and publication of aggregate evaluation artifacts.
4. Leakage controls separate training and evaluation by time, and preferably by service period.
5. Missingness, duplicates, clock errors, and impossible movements are profiled and documented.
6. A simple schedule/rolling-median baseline is evaluated on the exact same held-out records.
7. Station-wise and time-wise groups contain published sample counts so small groups are not overinterpreted.

Until those criteria are met, NammaLink uses deterministic schedule planning and explicit uncertainty language.

## Dashboard integration

The native operator dashboard displays `0 trained ML models` and explains why evaluation charts are absent. The web operator dashboard displays meaningful real-data schedule-supply graphs for the bounded demonstration and full BMTC feed, including 57,836 scheduled trips and top-route trip counts. These are explicitly labelled as supply—not ML evaluation, ridership, reliability, occupancy, or revenue. When a validated model run exists, only generated artifacts whose run identifiers and numerical metrics pass the above policy will be integrated.

## Device evidence

Physical-device screenshots from the first native milestone are stored under `research_outputs/device_evidence/`:

- `android-journey.png` — scheduled journey contract;
- `android-recovery.png` — simulated recovery path and persisted saved state;
- `android-operator.png` — schedule metrics and ML evidence gate.
