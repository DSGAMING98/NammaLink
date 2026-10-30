import metadata from "@/data/transit-connections.meta.json";
import stopIndex from "@/data/transit-stops.json";
import { earliestArrival, formatServiceTime, latestDeparture, parseServiceTime } from "@/lib/transit/connection-router";
import { loadFullConnectionIndex } from "@/lib/transit/full-index";
import { activeTripsForDate } from "@/lib/transit/service-calendar";

export const runtime = "nodejs";

const physicalStopNumber = new Map(stopIndex.stops.map((stop, index) => [stop.id, index]));
const stopNumber = new Map(stopIndex.stops.map((stop, index) => [stop.id, stop.parentId ? physicalStopNumber.get(stop.parentId) ?? index : index]));
const unique = (values: number[]) => [...new Set(values)];
const routableStops = (stop: typeof stopIndex.stops[number]) => {
  const ids = "routableStopIds" in stop && Array.isArray(stop.routableStopIds) ? stop.routableStopIds : [stop.id];
  return unique(ids.map((id) => stopNumber.get(id)).filter((value): value is number => value !== undefined));
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const originId = url.searchParams.get("origin") ?? "";
  const destinationId = url.searchParams.get("destination") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const departAfterInput = url.searchParams.get("departAfter");
  const arriveByInput = url.searchParams.get("arriveBy");
  const timeMode = arriveByInput !== null ? "arriveBy" : "departAfter";
  const requestedTimeInput = arriveByInput ?? departAfterInput ?? "";
  const requestedTime = parseServiceTime(requestedTimeInput);
  const priority = url.searchParams.get("priority") ?? "safest";
  const maximumWalkingMeters = Number(url.searchParams.get("maxWalkingMeters") ?? "5000");
  const selectedOrigin = stopIndex.stops.find((stop) => stop.id === originId);
  const selectedDestination = stopIndex.stops.find((stop) => stop.id === destinationId);

  if (!selectedOrigin || !selectedDestination || (departAfterInput === null) === (arriveByInput === null) || requestedTime === null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Provide valid origin, destination, date, and exactly one of departAfter=HH:MM or arriveBy=HH:MM." }, { status: 400 });
  }
  if (!["safest", "fastest", "direct"].includes(priority) || !Number.isInteger(maximumWalkingMeters) || maximumWalkingMeters < 0 || maximumWalkingMeters > 5_000) {
    return Response.json({ error: "Provide priority=safest|fastest|direct and maxWalkingMeters from 0 to 5000." }, { status: 400 });
  }
  if (date < metadata.validFrom || date > metadata.validUntil) {
    return Response.json({ error: "Date is outside the static feed validity window.", validFrom: metadata.validFrom, validUntil: metadata.validUntil }, { status: 422 });
  }

  const started = performance.now();
  const index = await loadFullConnectionIndex();
  const activeTrips = activeTripsForDate(metadata.trips, metadata.services, date);
  const minimumTransferSeconds = priority === "safest" ? 180 : 0;
  const originStops = routableStops(selectedOrigin);
  const destinationStops = routableStops(selectedDestination);
  const scanOptions = { maximumWalkingMeters, directOnly: priority === "direct" };
  const arriveByResult = timeMode === "arriveBy" ? latestDeparture(index, originStops, destinationStops, requestedTime, minimumTransferSeconds, activeTrips, scanOptions) : null;
  const legs = arriveByResult?.legs ?? (timeMode === "departAfter" ? earliestArrival(index, originStops, destinationStops, requestedTime, minimumTransferSeconds, activeTrips, scanOptions) : null);
  const scanCount = arriveByResult?.scanCount ?? 1;
  const latestStart = arriveByResult?.departAfter ?? (timeMode === "departAfter" ? requestedTime : null);
  const contract = { timeMode, requestedTime: requestedTimeInput, latestStart: latestStart === null ? null : formatServiceTime(latestStart), deadlineMet: timeMode === "arriveBy" ? legs !== null : null, priority, maximumWalkingMeters, minimumTransferSeconds, directOnly: priority === "direct" };
  const queryMilliseconds = Math.round((performance.now() - started) * 10) / 10;
  if (!legs) {
    return Response.json({ journey: null, queryMilliseconds, contract, scanCount, evidence: "No scheduled path found that satisfies this journey contract in the indexed static feed." });
  }

  const rides: Array<{ tripId: string; route: string; routeColor: string | null; agency: string; mode: string; headsign: string; from: typeof stopIndex.stops[number]; to: typeof stopIndex.stops[number]; departure: string; arrival: string; stopCount: number; distanceMeters?: number }> = [];
  for (const leg of legs) {
    if (leg.trip < 0) {
      rides.push({ tripId: `walk:${leg.from}:${leg.to}`, route: "Walk", routeColor: null, agency: "NammaLink", mode: "walk", headsign: "", from: stopIndex.stops[leg.from]!, to: stopIndex.stops[leg.to]!, departure: formatServiceTime(leg.departure), arrival: formatServiceTime(leg.arrival), stopCount: 0, distanceMeters: leg.distanceMeters });
      continue;
    }
    const trip = metadata.trips[leg.trip];
    if (!trip) continue;
    const last = rides.at(-1);
    if (last && last.tripId === trip.id) {
      last.to = stopIndex.stops[leg.to]!;
      last.arrival = formatServiceTime(leg.arrival);
      last.stopCount += 1;
    } else {
      rides.push({ tripId: trip.id, route: trip.route, routeColor: trip.routeColor, agency: trip.agency, mode: trip.mode, headsign: trip.headsign, from: stopIndex.stops[leg.from]!, to: stopIndex.stops[leg.to]!, departure: formatServiceTime(leg.departure), arrival: formatServiceTime(leg.arrival), stopCount: 1 });
    }
  }

  return Response.json({
    journey: { origin: selectedOrigin, destination: selectedDestination, departure: rides[0]?.departure, arrival: rides.at(-1)?.arrival, transfers: Math.max(0, rides.filter((ride) => ride.mode !== "walk").length - 1), walkingMeters: rides.reduce((sum, ride) => sum + (ride.distanceMeters ?? 0), 0), modes: [...new Set(rides.filter((ride) => ride.mode !== "walk").map((ride) => ride.mode))], contract, rides },
    queryMilliseconds,
    network: { feedVersions: metadata.feedVersions, validFrom: metadata.validFrom, validUntil: metadata.validUntil, stops: metadata.searchableStopCount, routingNodes: metadata.stopCount, trips: metadata.tripCount, activeTrips: activeTrips.reduce((sum, value) => sum + value, 0), connections: metadata.connectionCount, transferFootpaths: metadata.footpaths.length, scanCount, scanStrategy: timeMode === "arriveBy" ? "minute-precision monotone deadline search" : "single forward scan", footpathPolicy: metadata.footpathPolicy, plausibilityGate: metadata.plausibilityGate, sources: metadata.sources, license: metadata.license, realtime: false },
  });
}
