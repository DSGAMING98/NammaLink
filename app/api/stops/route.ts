import stopIndex from "@/data/transit-stops.json";
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
      license: stopIndex.metadata.license,
      indexedStops: stopIndex.metadata.searchableCount,
      feeds: stopIndex.metadata.feeds,
    },
  });
}
