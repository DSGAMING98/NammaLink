export type IndexedService = {
  validFrom: string;
  validUntil: string;
  weekdays: boolean[];
  exceptions: Record<string, number | undefined>;
};

export type IndexedTripService = { service: number };

export function activeServicesForDate(services: IndexedService[], date: string): Uint8Array {
  const active = new Uint8Array(services.length);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return active;
  const mondayFirstWeekday = (parsed.getUTCDay() + 6) % 7;
  services.forEach((service, index) => {
    const exception = service.exceptions[date];
    if (exception === 1) active[index] = 1;
    else if (exception !== 2 && date >= service.validFrom && date <= service.validUntil && service.weekdays[mondayFirstWeekday]) active[index] = 1;
  });
  return active;
}

export function activeTripsForDate(trips: IndexedTripService[], services: IndexedService[], date: string): Uint8Array {
  const activeServices = activeServicesForDate(services, date);
  const activeTrips = new Uint8Array(trips.length);
  trips.forEach((trip, index) => {
    if (trip.service >= 0 && activeServices[trip.service] === 1) activeTrips[index] = 1;
  });
  return activeTrips;
}
