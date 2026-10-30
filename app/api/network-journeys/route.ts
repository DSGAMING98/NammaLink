import metadata from "@/data/bmtc-connections.meta.json";
import stopIndex from "@/data/bmtc-stops.json";
import { earliestArrival, formatServiceTime, parseServiceTime } from "@/lib/transit/connection-router";
import { loadFullConnectionIndex } from "@/lib/transit/full-index";

export const runtime = "nodejs";

const stopNumber = new Map(stopIndex.stops.map((stop, index) => [stop.id, index]));

export async function GET(request: Request) {
  const url = new URL(request.url);
  const originId = url.searchParams.get("origin") ?? "";
  const destinationId = url.searchParams.get("destination") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const departAfter = parseServiceTime(url.searchParams.get("departAfter") ?? "");
  const origin = stopNumber.get(originId);
  const destination = stopNumber.get(destinationId);

  if (origin === undefined || destination === undefined || departAfter === null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Provide valid origin, destination, date, and departAfter=HH:MM." }, { status: 400 });
  }
  if (date < metadata.validFrom || date > metadata.validUntil) {
    return Response.json({ error: "Date is outside the static feed validity window.", validFrom: metadata.validFrom, validUntil: metadata.validUntil }, { status: 422 });
  }

  const started = performance.now();
  const index = await loadFullConnectionIndex();
  const legs = earliestArrival(index, origin, destination, departAfter, 180);
  const queryMilliseconds = Math.round((performance.now() - started) * 10) / 10;
  if (!legs) {
    return Response.json({ journey: null, queryMilliseconds, evidence: "No scheduled path found in the indexed static feed." });
  }

  const rides: Array<{ tripId: string; route: string; headsign: string; from: typeof stopIndex.stops[number]; to: typeof stopIndex.stops[number]; departure: string; arrival: string; stopCount: number }> = [];
  for (const leg of legs) {
    const trip = metadata.trips[leg.trip];
    const last = rides.at(-1);
    if (last?.tripId === trip.id) {
      last.to = stopIndex.stops[leg.to];
      last.arrival = formatServiceTime(leg.arrival);
      last.stopCount += 1;
    } else {
      rides.push({ tripId: trip.id, route: trip.route, headsign: trip.headsign, from: stopIndex.stops[leg.from], to: stopIndex.stops[leg.to], departure: formatServiceTime(leg.departure), arrival: formatServiceTime(leg.arrival), stopCount: 1 });
    }
  }

  return Response.json({
    journey: { origin: stopIndex.stops[origin], destination: stopIndex.stops[destination], departure: rides[0]?.departure, arrival: rides.at(-1)?.arrival, transfers: Math.max(0, rides.length - 1), rides },
    queryMilliseconds,
    network: { feedVersion: metadata.feedVersion, validFrom: metadata.validFrom, validUntil: metadata.validUntil, stops: metadata.stopCount, trips: metadata.tripCount, connections: metadata.connectionCount, plausibilityGate: metadata.plausibilityGate, source: metadata.source, license: metadata.license, realtime: false },
  });
}
