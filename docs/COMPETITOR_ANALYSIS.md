# Competitor and ecosystem analysis

Last updated: 29 October 2026

This comparison avoids claiming that established products lack common journey-planning capabilities. It identifies where NammaLink's current prototype is narrower and where its design emphasis differs.

| Product | Confirmed capabilities | Relevance to NammaLink |
| --- | --- | --- |
| [Google Maps](https://support.google.com/maps/answer/6142130) | Public-transport routes, nearby departures, schedules or realtime departures where supplied, alternate departures after a missed train | Strong general journey planner and map. NammaLink does not compete on global coverage; it makes passenger hard constraints and source-labelled recovery evidence explicit. |
| [Moovit](https://moovit.com/features/) | Multimodal planning, realtime arrivals, service alerts, saved places/lines, and mobility payments in supported markets | Demonstrates that multimodal routes and alerts are established features. NammaLink's proposed distinction is the Journey Contract plus evidence-aware recovery of an already-started trip. |
| [Chennai One](https://www.chennaione.in/) | Government-backed bus/Metro/train/auto/cab integration and unified ticketing; [MTC describes ETA/tracking and ticketing](https://mtcbus.tn.gov.in/Home/facilities) | Shows that integrated urban mobility and payment are already achievable in India. NammaLink currently has no ticketing and should not imply otherwise. |
| Namma BMTC ecosystem | The [official airport service site](https://kias.mybmtc.com/index.php) exposes timetable, fare, journey-planning, and live-route surfaces. Reporting on the September 2026 Namma BMTC 2.0 launch describes integrated bus/Metro planning, tracking, and ticketing. | Official systems are the authority for live service. NammaLink should complement them with constraint transparency and recovery experiments, not substitute unofficial static data for official operations. |

## Common capabilities NammaLink does not claim as unique

- Origin/destination journey planning.
- Multimodal comparison.
- Realtime arrivals when an operator supplies them.
- Service alerts and alternate departures.
- Nearby stops, saved places, map display, and digital ticketing.

## NammaLink emphasis

1. Arrival-deadline planning with an explicit safety allowance.
2. Hard maximums for walking and transfers, applied before ranking.
3. Direct-only and direct-preferred semantics that cannot silently permit transfers.
4. Separate fastest, least-waiting, and least-walking objectives.
5. Evidence states preventing one report from becoming a confirmed closure.
6. Recovery from the current journey state while preserving completed legs.
7. Plain-language explanation of constraint violations and source category.
8. A limited device-local fallback that makes its offline limitations visible.

## Current competitive limitations

NammaLink has only a three-route static fixture, a fixed campus demonstration, no map integration, no authorized realtime feed, no ticketing, and no deployed service. The technically defensible claim is a tested constraint-and-recovery workflow—not broader data coverage than established platforms.
