# Deployment and production connectivity

Updated: 30 October 2026

## Deployment contract

NammaLink produces Next.js standalone output and a non-root multi-stage container. A deployment is ready only when `GET /api/health` returns HTTP 200 with `status: "ok"`. The response exposes service revision, schedule validity, record counts, and boolean capability flags; it never returns credentials.

Required for core schedule search and routing: no external API key. Optional map endpoints use `GOOGLE_PLACES_API_KEY`, `GOOGLE_GEOCODING_API_KEY`, and `GOOGLE_ROUTES_API_KEY` only on the server. Copy values from a secret manager into the host environment. Never put them in a Docker build argument, Android Gradle property, client bundle, or Git.

## Reproducible checks

```powershell
pnpm install --frozen-lockfile
pnpm verify:engineering
docker build -t nammalink .
docker run --rm -p 3000:3000 --env-file .env.local nammalink
```

Post-deploy checks, replacing the origin:

```powershell
$origin = 'https://your-host'
Invoke-RestMethod "$origin/api/health"
Invoke-RestMethod "$origin/api/stops?q=Majestic&limit=5"
Invoke-RestMethod "$origin/api/network-journeys?origin=20921&destination=20707&date=2026-10-30&departAfter=08%3A00&priority=safest&maxWalkingMeters=800"
```

Then create the installable presentation APK:

```powershell
Set-Location android
.\gradlew.bat :app:assemblePresentation -PNAMMALINK_API_BASE_URL=https://your-host
```

That build fails unless the origin is public HTTPS. Cleartext traffic is disabled in presentation/release manifests. `debug` is the only variant allowed to use `127.0.0.1` with `adb reverse`.

## Current external state

No public deployment URL is claimed. The connected Vercel integration currently exposes no team or project, and no supported deployment-provider credential is available in the development environment. Connecting a Vercel team/project (or providing another approved host) is the one required owner action before the no-USB public-phone acceptance gate can run.

Google Routes and Geocoding authorization probes pass. Places Autocomplete is implemented but its current key returns `PERMISSION_DENIED` for server calls because requests without an HTTP referrer are blocked. Correct that key restriction or supply a server-restricted Places key before enabling arbitrary-place search.
