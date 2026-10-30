export interface TripSupplyRecord { routeId: string; route: string }

export function analyzeFullNetworkSupply(trips: TripSupplyRecord[]) {
  const counts = new Map<string, { routeId: string; route: string; trips: number }>();
  for (const trip of trips) {
    const key = trip.routeId;
    const current = counts.get(key) ?? { routeId: key, route: trip.route || key, trips: 0 };
    current.trips += 1;
    counts.set(key, current);
  }
  const routes = [...counts.values()].sort((left, right) => right.trips - left.trips || left.route.localeCompare(right.route));
  return { totalTrips: trips.length, totalRoutes: routes.length, routes, maximumTrips: routes[0]?.trips ?? 0 };
}
