import { parseGtfsTime } from "@/lib/transit/time";
import type { TransitNetwork } from "@/lib/transit/types";

export interface RouteScheduleInsight {
  routeId: string;
  shortName: string;
  trips: number;
  firstDepartureSeconds: number;
  lastDepartureSeconds: number;
  medianHeadwayMinutes: number | null;
  servedStops: number;
}

export interface ScheduleInsights {
  routes: RouteScheduleInsight[];
  totalTrips: number;
  totalStops: number;
  sharedStopPairs: Array<{ leftRoute: string; rightRoute: string; sharedStops: number }>;
  scope: "bounded_schedule";
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function analyzeSchedule(network: TransitNetwork): ScheduleInsights {
  const routesById = new Map(network.routes.map((route) => [route.id, route]));
  const tripGroups = new Map<string, typeof network.trips>();
  for (const trip of network.trips) {
    const group = tripGroups.get(trip.routeId) ?? [];
    group.push(trip);
    tripGroups.set(trip.routeId, group);
  }

  const routeStopSets = new Map<string, Set<string>>();
  const routes = [...tripGroups.entries()].map(([routeId, trips]) => {
    const route = routesById.get(routeId);
    if (!route) throw new Error(`Trip references missing route ${routeId}`);
    const departures = trips.map((trip) => parseGtfsTime(trip.stopTimes[0].departure));
    const byDirection = new Map<string, number[]>();
    const stops = new Set<string>();
    for (const trip of trips) {
      const directionDepartures = byDirection.get(trip.directionId) ?? [];
      directionDepartures.push(parseGtfsTime(trip.stopTimes[0].departure));
      byDirection.set(trip.directionId, directionDepartures);
      trip.stopTimes.forEach((stopTime) => stops.add(stopTime.stopId));
    }
    routeStopSets.set(routeId, stops);

    const headways: number[] = [];
    for (const directionDepartures of byDirection.values()) {
      directionDepartures.sort((left, right) => left - right);
      for (let index = 1; index < directionDepartures.length; index += 1) {
        headways.push((directionDepartures[index] - directionDepartures[index - 1]) / 60);
      }
    }

    return {
      routeId,
      shortName: route.shortName,
      trips: trips.length,
      firstDepartureSeconds: Math.min(...departures),
      lastDepartureSeconds: Math.max(...departures),
      medianHeadwayMinutes: median(headways),
      servedStops: stops.size,
    };
  }).sort((left, right) => right.trips - left.trips);

  const sharedStopPairs: ScheduleInsights["sharedStopPairs"] = [];
  for (let left = 0; left < routes.length; left += 1) {
    for (let right = left + 1; right < routes.length; right += 1) {
      const leftStops = routeStopSets.get(routes[left].routeId) ?? new Set();
      const rightStops = routeStopSets.get(routes[right].routeId) ?? new Set();
      const sharedStops = [...leftStops].filter((stopId) => rightStops.has(stopId)).length;
      sharedStopPairs.push({ leftRoute: routes[left].shortName, rightRoute: routes[right].shortName, sharedStops });
    }
  }

  return {
    routes,
    totalTrips: network.trips.length,
    totalStops: network.stops.length,
    sharedStopPairs: sharedStopPairs.sort((left, right) => right.sharedStops - left.sharedStops),
    scope: "bounded_schedule",
  };
}
