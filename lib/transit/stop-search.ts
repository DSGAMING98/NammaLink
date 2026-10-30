export type SearchableStop = { id: string; name: string; lat: number; lon: number; agency?: string; mode?: string; searchable?: boolean };
export type NearbyStop = SearchableStop & { distanceMeters: number };

const normalize = (value: string) =>
  value.normalize("NFKD").toLocaleLowerCase("en-IN").replace(/[^a-z0-9]+/g, " ").trim();

export function searchStops(stops: SearchableStop[], query: string, limit = 10): SearchableStop[] {
  const needle = normalize(query);
  if (needle.length < 2) return [];
  const tokens = needle.split(" ");
  return stops
    .filter((stop) => stop.searchable !== false)
    .map((stop) => {
      const name = normalize(stop.name);
      if (!tokens.every((token) => name.includes(token))) return null;
      const score = name === needle ? 0 : name.startsWith(needle) ? 1 : name.split(" ").some((word) => word.startsWith(needle)) ? 2 : 3;
      return { stop, score };
    })
    .filter((match): match is { stop: SearchableStop; score: number } => match !== null)
    .sort((left, right) => left.score - right.score || left.stop.name.localeCompare(right.stop.name) || left.stop.id.localeCompare(right.stop.id))
    .slice(0, Math.max(1, Math.min(limit, 25)))
    .map(({ stop }) => stop);
}

const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function distanceMeters(left: { lat: number; lon: number }, right: { lat: number; lon: number }): number {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = radians(right.lat - left.lat);
  const longitudeDelta = radians(right.lon - left.lon);
  const latitude1 = radians(left.lat);
  const latitude2 = radians(right.lat);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
}

export function nearbyStops(
  stops: SearchableStop[],
  location: { lat: number; lon: number },
  limit = 8,
  radiusMeters = 2_000,
): NearbyStop[] {
  const boundedLimit = Math.max(1, Math.min(limit, 25));
  const boundedRadius = Math.max(100, Math.min(radiusMeters, 5_000));
  return stops
    .filter((stop) => stop.searchable !== false)
    .map((stop) => ({ ...stop, distanceMeters: Math.round(distanceMeters(location, stop)) }))
    .filter((stop) => stop.distanceMeters <= boundedRadius)
    .sort((left, right) => left.distanceMeters - right.distanceMeters || left.name.localeCompare(right.name) || left.id.localeCompare(right.id))
    .slice(0, boundedLimit);
}
