# Native Android API release audit

Verified on 31 October 2026 against `https://nammalink.vercel.app` with the presentation APK installed on the connected Vivo V2513. No ADB reverse rule was present.

| Backend endpoint | Native Android status | Release evidence |
| --- | --- | --- |
| `GET /api/health` | Connected | Planner showed API `0.1.0`, revision `fa406c2`, geocoding and walking-route capabilities. |
| `GET /api/stops` | Connected | Text search, nearby-stop search and the 10,043-stop fallback returned real BMTC/BMRCL stops. |
| `GET /api/network-journeys` | Connected | Majestic to Central Silk Board returned a real mixed BMTC/Metro itinerary, scheduled times, transfers and alternatives. |
| `GET /api/airport` | Connected | To Airport and From Airport were tested independently; KIA-10 schedules and direction-correct terminal/corridor data rendered. |
| `GET /api/maps/geocode` | Connected | An arbitrary Phoenix Mall of Asia search resolved to coordinates and nearby verified stops. |
| `GET /api/maps/place` | Connected | Geocoded place IDs are resolved before the app offers their nearby boarding stops. |
| `POST /api/maps/walking-route` | Connected | The mixed-mode journey rendered the verified walking geometry returned for its 136 m transfer. |
| `GET /api/maps/autocomplete` | Capability-gated | Production reports `autocomplete: false` and returns `503 CONFIGURATION_ERROR`. Android does not expose a broken control; it uses geocoding plus verified stop search. |
| `POST /api/journeys` | Deliberately excluded | This route uses `demo-network.json`; it is not a production passenger data source. |
| `POST /api/recovery` | Deliberately excluded | This route is an explicitly simulated disruption demonstration; it is not presented as live passenger information. |

The native app contains no OTP/auth backend endpoint. No MSG91/OTP environment variable was available in the local project environment during this audit, so genuine SMS authentication is not claimed.

Additional device checks:

- Removed the user walking-limit selector; production requests use a bounded 100 km computational ceiling rather than a passenger-facing rejection cap.
- Replaced the primary Canvas route drawing with a touch-enabled native OpenStreetMap/Esri map, markers, route framing, street/satellite switching and map lifecycle handling.
- Saved journey and full airport-route snapshots were restored with mobile data disabled.
- The old APK is preserved under `public/downloads/archive/` before replacing the public presentation APK.
