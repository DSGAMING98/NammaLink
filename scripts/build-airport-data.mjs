import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

const gtfsDirectory = path.resolve(process.env.BMTC_GTFS_DIR ?? "../bmtc");
const outputPath = path.resolve("data/airport-network.json");

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) { cells.push(cell); cell = ""; }
    else cell += character;
  }
  cells.push(cell);
  return cells;
}

async function scanCsv(fileName, onRow) {
  const lines = readline.createInterface({ input: createReadStream(path.join(gtfsDirectory, fileName), { encoding: "utf8" }), crlfDelay: Infinity });
  let headers;
  for await (const line of lines) {
    if (!headers) { headers = parseCsvLine(line.replace(/^\uFEFF/, "")); continue; }
    const values = parseCsvLine(line);
    onRow(Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
  }
}

const routes = new Map();
await scanCsv("routes.txt", (row) => {
  if (/^KIA(?:-|\s)/i.test(row.route_short_name) && !/test/i.test(row.route_short_name)) routes.set(row.route_id, row);
});

const services = new Map();
await scanCsv("calendar.txt", (row) => services.set(row.service_id, {
  validFrom: `${row.start_date.slice(0, 4)}-${row.start_date.slice(4, 6)}-${row.start_date.slice(6, 8)}`,
  validUntil: `${row.end_date.slice(0, 4)}-${row.end_date.slice(4, 6)}-${row.end_date.slice(6, 8)}`,
  weekdays: [row.monday, row.tuesday, row.wednesday, row.thursday, row.friday, row.saturday, row.sunday].map((value) => value === "1"),
}));

const trips = new Map();
await scanCsv("trips.txt", (row) => {
  if (routes.has(row.route_id)) trips.set(row.trip_id, { ...row, stopTimes: [] });
});

const stops = new Map();
await scanCsv("stops.txt", (row) => {
  const latitude = Number(row.stop_lat);
  const longitude = Number(row.stop_lon);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) stops.set(row.stop_id, { id: row.stop_id, name: row.stop_name, lat: latitude, lon: longitude });
});

await scanCsv("stop_times.txt", (row) => {
  const trip = trips.get(row.trip_id);
  if (trip) trip.stopTimes.push({ stopId: row.stop_id, arrival: row.arrival_time.slice(0, 5), departure: row.departure_time.slice(0, 5), sequence: Number(row.stop_sequence) });
});

const fares = new Map();
await scanCsv("fare_attributes.txt", (row) => fares.set(row.fare_id, { amount: Number(row.price), currency: row.currency_type }));
const routeFares = new Map();
await scanCsv("fare_rules.txt", (row) => {
  if (!routes.has(row.route_id)) return;
  const fare = fares.get(row.fare_id);
  if (!fare || !Number.isFinite(fare.amount)) return;
  const key = `${row.route_id}:${row.origin_id}:${row.destination_id}`;
  routeFares.set(key, { fromStopId: row.origin_id, toStopId: row.destination_id, ...fare });
});

const routeGroups = new Map();
for (const trip of trips.values()) {
  trip.stopTimes.sort((left, right) => left.sequence - right.sequence);
  if (trip.stopTimes.length < 2) continue;
  const key = `${trip.route_id}:${trip.direction_id || "0"}`;
  const group = routeGroups.get(key) ?? [];
  group.push(trip);
  routeGroups.set(key, group);
}

const airportPattern = /kempegowda international airport|^airport$/i;
const routeDirections = [...routeGroups.entries()].flatMap(([key, group]) => {
  const [routeId, directionId] = key.split(":");
  const route = routes.get(routeId);
  const canonical = group.reduce((best, trip) => trip.stopTimes.length > best.stopTimes.length ? trip : best, group[0]);
  const canonicalStops = canonical.stopTimes.map((time) => ({ ...stops.get(time.stopId), arrival: time.arrival, departure: time.departure })).filter((stop) => stop.id);
  const first = canonicalStops[0];
  const last = canonicalStops.at(-1);
  const fromAirport = airportPattern.test(first.name);
  const toAirport = airportPattern.test(last.name);
  if (!fromAirport && !toAirport) return [];
  const departures = [...new Set(group.map((trip) => trip.stopTimes[0]?.departure).filter(Boolean))].sort();
  const fareRecords = [...routeFares.entries()].filter(([fareKey]) => fareKey.startsWith(`${routeId}:`)).map(([, fare]) => fare);
  const fareAmounts = [...new Set(fareRecords.map((fare) => fare.amount))].sort((left, right) => left - right);
  const terminalFare = fareRecords.filter((fare) => fare.fromStopId === first.id && fare.toStopId === last.id).sort((left, right) => right.amount - left.amount)[0]
    ?? fareRecords.filter((fare) => fare.fromStopId === last.id && fare.toStopId === first.id).sort((left, right) => right.amount - left.amount)[0]
    ?? null;
  return [{
    id: key,
    routeId,
    route: route.route_short_name,
    longName: route.route_long_name,
    directionId,
    direction: toAirport ? "to_airport" : "from_airport",
    origin: first,
    destination: last,
    stops: canonicalStops,
    departures,
    scheduledTripCount: group.length,
    fare: terminalFare,
    fareRange: fareAmounts.length ? { minimum: fareAmounts[0], maximum: fareAmounts.at(-1), currency: fareRecords[0].currency, source: "GTFS fare_rules + fare_attributes" } : null,
    serviceIds: [...new Set(group.map((trip) => trip.service_id))],
  }];
}).sort((left, right) => left.route.localeCompare(right.route) || left.direction.localeCompare(right.direction));

const feedInfoText = await readFile(path.join(gtfsDirectory, "feed_info.txt"), "utf8");
const [feedHeaders, feedValues] = feedInfoText.trim().split(/\r?\n/).map(parseCsvLine);
const feedInfo = Object.fromEntries(feedHeaders.map((header, index) => [header, feedValues[index] ?? ""]));
const payload = {
  metadata: {
    name: "NammaLink Vayu Vajra scheduled airport network",
    generatedAt: new Date(Number(process.env.SOURCE_DATE_EPOCH ?? Date.UTC(2026, 9, 31))).toISOString(),
    feedVersion: feedInfo.feed_version,
    validFrom: `${feedInfo.feed_start_date.slice(0, 4)}-${feedInfo.feed_start_date.slice(4, 6)}-${feedInfo.feed_start_date.slice(6, 8)}`,
    validUntil: `${feedInfo.feed_end_date.slice(0, 4)}-${feedInfo.feed_end_date.slice(4, 6)}-${feedInfo.feed_end_date.slice(6, 8)}`,
    source: "Vonter/bmtc-gtfs community static GTFS",
    sourceUrl: feedInfo.feed_publisher_url,
    license: "ODbL-1.0",
    realtime: false,
    historicalFareReference: { title: "Vayuvajra Services Main Bus Stop Wise Fare @05.01.2025", status: "historical_not_current" },
  },
  services: Object.fromEntries(services),
  directions: routeDirections,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload)}\n`);
console.log(`Wrote ${routeDirections.length} airport route directions and ${routeDirections.reduce((sum, route) => sum + route.departures.length, 0)} unique origin departures to ${outputPath}`);
