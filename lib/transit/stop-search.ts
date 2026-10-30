export type SearchableStop = { id: string; name: string; lat: number; lon: number; agency?: string; mode?: string; searchable?: boolean };

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
