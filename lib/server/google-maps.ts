import "server-only";

const BENGALURU_BOUNDS = { low: { latitude: 12.73, longitude: 77.30 }, high: { latitude: 13.25, longitude: 77.90 } };
const TIMEOUT_MS = 7_000;
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();

export type LatLng = { latitude: number; longitude: number };

async function cached<T>(cacheKey: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const current = responseCache.get(cacheKey);
  if (current && current.expiresAt > now) return current.value as T;
  const value = await load();
  responseCache.set(cacheKey, { expiresAt: now + ttlMs, value });
  if (responseCache.size > 500) {
    for (const [key, entry] of responseCache) if (entry.expiresAt <= now) responseCache.delete(key);
  }
  return value;
}

function key(name: "GOOGLE_PLACES_API_KEY" | "GOOGLE_GEOCODING_API_KEY" | "GOOGLE_ROUTES_API_KEY"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function parseGoogle(response: Response): Promise<Record<string, unknown>> {
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const nested = body.error as { message?: string; status?: string } | undefined;
    throw new Error(`Google ${nested?.status || response.status}: ${nested?.message || "request failed"}`);
  }
  return body;
}

export function googleCapabilities() {
  return {
    autocomplete: Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim()),
    geocoding: Boolean(process.env.GOOGLE_GEOCODING_API_KEY?.trim()),
    walkingRoutes: Boolean(process.env.GOOGLE_ROUTES_API_KEY?.trim()),
    browserMap: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()),
  };
}

export async function autocompletePlaces(input: string, sessionToken?: string) {
  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key("GOOGLE_PLACES_API_KEY") },
    body: JSON.stringify({ input, sessionToken, includedRegionCodes: ["in"], locationBias: { rectangle: BENGALURU_BOUNDS } }),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = await parseGoogle(response);
  const suggestions = Array.isArray(body.suggestions) ? body.suggestions : [];
  return suggestions.flatMap((item) => {
    const prediction = (item as { placePrediction?: Record<string, unknown> }).placePrediction;
    if (!prediction) return [];
    const text = prediction.text as { text?: string } | undefined;
    const structured = prediction.structuredFormat as { mainText?: { text?: string }; secondaryText?: { text?: string } } | undefined;
    return [{ placeId: String(prediction.placeId || ""), text: text?.text || "", mainText: structured?.mainText?.text || text?.text || "", secondaryText: structured?.secondaryText?.text || "" }];
  }).filter((item) => item.placeId && item.text);
}

export async function geocodeAddress(address: string) {
  return cached(`geocode:${address.toLocaleLowerCase("en-IN")}`, 10 * 60_000, async () => {
  const params = new URLSearchParams({ address, bounds: "12.73,77.30|13.25,77.90", region: "in", key: key("GOOGLE_GEOCODING_API_KEY") });
  const body = await parseGoogle(await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) }));
  const status = String(body.status || "UNKNOWN");
  if (status !== "OK" && status !== "ZERO_RESULTS") throw new Error(`Google geocoding ${status}`);
  const results = Array.isArray(body.results) ? body.results : [];
  return results.slice(0, 8).flatMap((result) => {
    const value = result as { place_id?: string; formatted_address?: string; geometry?: { location?: { lat?: number; lng?: number } } };
    const location = value.geometry?.location;
    return typeof location?.lat === "number" && typeof location.lng === "number"
      ? [{ placeId: value.place_id || "", text: value.formatted_address || address, location: { latitude: location.lat, longitude: location.lng } }]
      : [];
  });
  });
}

export async function geocodePlace(placeId: string) {
  return cached(`place:${placeId}`, 30 * 60_000, async () => {
  const params = new URLSearchParams({ place_id: placeId, key: key("GOOGLE_GEOCODING_API_KEY") });
  const body = await parseGoogle(await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) }));
  const result = Array.isArray(body.results) ? body.results[0] as { formatted_address?: string; geometry?: { location?: { lat?: number; lng?: number } } } | undefined : undefined;
  const location = result?.geometry?.location;
  if (typeof location?.lat !== "number" || typeof location.lng !== "number") return null;
  return { placeId, text: result?.formatted_address || "", location: { latitude: location.lat, longitude: location.lng } };
  });
}

export async function walkingRoute(origin: LatLng, destination: LatLng) {
  const cacheKey = `walk:${origin.latitude.toFixed(5)},${origin.longitude.toFixed(5)}:${destination.latitude.toFixed(5)},${destination.longitude.toFixed(5)}`;
  return cached(cacheKey, 60_000, async () => {
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key("GOOGLE_ROUTES_API_KEY"),
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
    },
    body: JSON.stringify({ origin: { location: { latLng: origin } }, destination: { location: { latLng: destination } }, travelMode: "WALK" }),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = await parseGoogle(response);
  const routes = Array.isArray(body.routes) ? body.routes : [];
  return routes.slice(0, 1).map((route) => {
    const value = route as { distanceMeters?: number; duration?: string; polyline?: { encodedPolyline?: string } };
    return { distanceMeters: value.distanceMeters || 0, duration: value.duration || "0s", encodedPolyline: value.polyline?.encodedPolyline || "" };
  });
  });
}
