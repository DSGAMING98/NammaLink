import airportNetwork from "@/data/airport-network.json";
import { distanceMeters } from "@/lib/transit/stop-search";

type AirportDirection = (typeof airportNetwork.directions)[number];
export type AirportMode = "to_airport" | "from_airport";

function serviceActive(serviceIds: string[], date: string) {
  const day = new Date(`${date}T12:00:00+05:30`).getDay();
  const weekdayIndex = day === 0 ? 6 : day - 1;
  return serviceIds.some((id) => {
    const service = airportNetwork.services[id as keyof typeof airportNetwork.services];
    return service && date >= service.validFrom && date <= service.validUntil && service.weekdays[weekdayIndex];
  });
}

function minutes(value: string) {
  const [hours, minute] = value.split(":").map(Number);
  return hours * 60 + minute;
}

export function queryAirportServices(input: { mode: AirportMode; date: string; after: string; latitude?: number; longitude?: number; query?: string }) {
  const afterMinutes = minutes(input.after);
  const normalizedQuery = input.query?.trim().toLocaleLowerCase("en-IN") ?? "";
  const routes = (airportNetwork.directions as AirportDirection[])
    .filter((route) => route.direction === input.mode && serviceActive(route.serviceIds, input.date))
    .filter((route) => !normalizedQuery || [route.route, route.longName, route.origin.name, route.destination.name, ...route.stops.map((stop) => stop.name)].some((value) => value.toLocaleLowerCase("en-IN").includes(normalizedQuery)))
    .map((route) => {
      const cityTerminal = input.mode === "to_airport" ? route.origin : route.destination;
      const proximityMeters = input.latitude === undefined || input.longitude === undefined ? null : Math.round(distanceMeters({ lat: input.latitude, lon: input.longitude }, cityTerminal));
      const upcoming = route.departures
        .map((departure) => ({ departure, waitMinutes: minutes(departure) - afterMinutes }))
        .filter((item) => item.waitMinutes >= 0)
        .slice(0, 6);
      return { ...route, proximityMeters, upcoming, sourceStatus: "scheduled_static" as const };
    })
    .sort((left, right) => {
      if (left.proximityMeters !== null && right.proximityMeters !== null && left.proximityMeters !== right.proximityMeters) return left.proximityMeters - right.proximityMeters;
      const leftWait = left.upcoming[0]?.waitMinutes ?? Number.POSITIVE_INFINITY;
      const rightWait = right.upcoming[0]?.waitMinutes ?? Number.POSITIVE_INFINITY;
      return leftWait - rightWait || left.route.localeCompare(right.route);
    });
  return { routes, metadata: airportNetwork.metadata };
}

export function airportMetadata() {
  return airportNetwork.metadata;
}
