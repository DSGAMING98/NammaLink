import stopIndex from "@/data/bmtc-stops.json";
import { searchStops } from "@/lib/transit/stop-search";

export const runtime = "nodejs";

export function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const requestedLimit = Number(url.searchParams.get("limit") ?? "10");
  const limit = Number.isInteger(requestedLimit) ? requestedLimit : 10;
  const stops = searchStops(stopIndex.stops, query, limit);
  return Response.json({
    query,
    count: stops.length,
    stops,
    provenance: {
      name: stopIndex.metadata.name,
      feedVersion: stopIndex.metadata.feedVersion,
      source: stopIndex.metadata.source,
      license: stopIndex.metadata.license,
      indexedStops: stopIndex.metadata.count,
    },
  });
}
