import stopIndex from "@/data/transit-stops.json";
import { nearbyStops, searchStops } from "@/lib/transit/stop-search";

export const runtime = "nodejs";

export function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const requestedLimit = Number(url.searchParams.get("limit") ?? "10");
  const limit = Number.isInteger(requestedLimit) ? requestedLimit : 10;
  const latitudeValue = url.searchParams.get("lat");
  const longitudeValue = url.searchParams.get("lon");
  const hasLocation = latitudeValue !== null || longitudeValue !== null;
  let stops;

  if (hasLocation) {
    const latitude = Number(latitudeValue);
    const longitude = Number(longitudeValue);
    const radiusValue = Number(url.searchParams.get("radiusMeters") ?? "2000");
    if (
      latitudeValue === null || longitudeValue === null
      || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
      || !Number.isFinite(radiusValue) || radiusValue <= 0
    ) {
      return Response.json({ error: "Valid lat, lon, and radiusMeters values are required for nearby-stop search." }, { status: 400 });
    }
    stops = nearbyStops(stopIndex.stops, { lat: latitude, lon: longitude }, limit, radiusValue);
  } else {
    stops = searchStops(stopIndex.stops, query, limit);
  }
  return Response.json({
    query,
    searchMode: hasLocation ? "nearby" : "text",
    count: stops.length,
    stops,
    provenance: {
      name: stopIndex.metadata.name,
      license: stopIndex.metadata.license,
      indexedStops: stopIndex.metadata.searchableCount,
      feeds: stopIndex.metadata.feeds,
    },
  });
}
