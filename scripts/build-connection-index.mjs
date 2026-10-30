import { createReadStream, existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import path from "node:path";
import readline from "node:readline";

const gzipAsync = promisify(gzip);
const feeds = [
  { agency: "BMTC", mode: "bus", directory: path.resolve(process.env.BMTC_GTFS_DIR ?? "../bmtc"), idPrefix: "", maximumSpeed: 25 },
  { agency: "BMRCL", mode: "metro", directory: path.resolve(process.env.BMRCL_GTFS_DIR ?? "../bmrcl"), idPrefix: "metro:", maximumSpeed: 45 },
];
const outputDirectory = path.resolve("data");

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

async function scanCsv(directory, fileName, onRow) {
  const filePath = path.join(directory, fileName);
  if (!existsSync(filePath)) return;
  const lines = readline.createInterface({ input: createReadStream(filePath, { encoding: "utf8" }), crlfDelay: Infinity });
  let headers;
  for await (const line of lines) {
    if (!headers) { headers = parseCsvLine(line.replace(/^\uFEFF/, "")); continue; }
    const values = parseCsvLine(line);
    await onRow(Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
  }
}

function seconds(value) {
  const [hours, minutes, secs] = value.split(":").map(Number);
  const result = hours * 3600 + minutes * 60 + secs;
  if (!Number.isFinite(result)) throw new Error(`Invalid GTFS time: ${value}`);
  return result;
}
const isoDate = (value) => `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;

const stopIndex = JSON.parse(await readFile(path.join(outputDirectory, "transit-stops.json"), "utf8"));
const physicalStopNumber = new Map(stopIndex.stops.map((stop, index) => [stop.id, index]));
const stopNumber = new Map(stopIndex.stops.map((stop, index) => [stop.id, stop.parentId ? physicalStopNumber.get(stop.parentId) ?? index : index]));
const radians = (degrees) => degrees * Math.PI / 180;
function distanceMeters(from, to) {
  const left = stopIndex.stops[from];
  const right = stopIndex.stops[to];
  const latitude = radians(right.lat - left.lat);
  const longitude = radians(right.lon - left.lon);
  const value = Math.sin(latitude / 2) ** 2 + Math.cos(radians(left.lat)) * Math.cos(radians(right.lat)) * Math.sin(longitude / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

const services = [];
const serviceNumber = new Map();
const trips = [];
const tripNumber = new Map();
const buckets = new Map();
let connectionCount = 0;
let maximumTime = 0;
const rejectionByAgency = {};

for (const feed of feeds) {
  const routeNames = new Map();
  await scanCsv(feed.directory, "routes.txt", (row) => routeNames.set(row.route_id, {
    id: `${feed.agency}:${row.route_id}`,
    name: row.route_short_name || row.route_long_name || row.route_id,
    color: row.route_color || null,
  }));

  await scanCsv(feed.directory, "calendar.txt", (row) => {
    const id = `${feed.agency}:${row.service_id}`;
    serviceNumber.set(id, services.length);
    services.push({
      id,
      validFrom: isoDate(row.start_date),
      validUntil: isoDate(row.end_date),
      weekdays: [row.monday, row.tuesday, row.wednesday, row.thursday, row.friday, row.saturday, row.sunday].map((value) => value === "1"),
      exceptions: {},
    });
  });
  await scanCsv(feed.directory, "calendar_dates.txt", (row) => {
    const service = services[serviceNumber.get(`${feed.agency}:${row.service_id}`)];
    if (service) service.exceptions[isoDate(row.date)] = Number(row.exception_type);
  });

  await scanCsv(feed.directory, "trips.txt", (row) => {
    const key = `${feed.agency}:${row.trip_id}`;
    const route = routeNames.get(row.route_id) ?? { id: `${feed.agency}:${row.route_id}`, name: row.route_id, color: null };
    tripNumber.set(key, trips.length);
    trips.push({ id: key, routeId: route.id, route: route.name, routeColor: route.color, headsign: row.trip_headsign, direction: row.direction_id, agency: feed.agency, mode: feed.mode, service: serviceNumber.get(`${feed.agency}:${row.service_id}`) ?? -1 });
  });

  const previous = new Map();
  let rejected = 0;
  await scanCsv(feed.directory, "stop_times.txt", (row) => {
    const trip = tripNumber.get(`${feed.agency}:${row.trip_id}`);
    const stop = stopNumber.get(`${feed.idPrefix}${row.stop_id}`);
    if (trip === undefined || stop === undefined) return;
    const current = { stop, arrival: seconds(row.arrival_time), departure: seconds(row.departure_time), sequence: Number(row.stop_sequence) };
    const prior = previous.get(trip);
    if (prior && current.sequence > prior.sequence) {
      const duration = current.arrival - prior.departure;
      const speedMetersPerSecond = duration > 0 ? distanceMeters(prior.stop, current.stop) / duration : Number.POSITIVE_INFINITY;
      if (duration <= 0 || speedMetersPerSecond > feed.maximumSpeed) rejected += 1;
      else {
        const bucket = buckets.get(prior.departure) ?? [];
        bucket.push(prior.departure, current.arrival, prior.stop, current.stop, trip);
        buckets.set(prior.departure, bucket);
        connectionCount += 1;
        maximumTime = Math.max(maximumTime, current.arrival);
      }
    }
    previous.set(trip, current);
  });
  rejectionByAgency[feed.agency] = { maximumSpeedMetersPerSecond: feed.maximumSpeed, rejectedConnections: rejected };
}

const recordBytes = 20;
const binary = Buffer.allocUnsafe(connectionCount * recordBytes);
let offset = 0;
for (const departure of [...buckets.keys()].sort((left, right) => left - right)) {
  const values = buckets.get(departure);
  for (let index = 0; index < values.length; index += 5) {
    for (let field = 0; field < 5; field += 1) binary.writeUInt32LE(values[index + field], offset + field * 4);
    offset += recordBytes;
  }
}

const compressed = await gzipAsync(binary, { level: 9 });
const footpaths = [];
const metroStations = stopIndex.stops.map((stop, index) => ({ stop, index })).filter(({ stop }) => stop.mode === "metro" && stop.searchable);
const busStops = stopIndex.stops.map((stop, index) => ({ stop, index })).filter(({ stop }) => stop.mode === "bus" && stop.searchable);
for (const metro of metroStations) {
  for (const bus of busStops) {
    const distance = Math.round(distanceMeters(metro.index, bus.index));
    if (distance > 250) continue;
    const durationSeconds = Math.max(30, Math.ceil(distance / 1.25));
    footpaths.push({ from: metro.index, to: bus.index, distanceMeters: distance, durationSeconds });
    footpaths.push({ from: bus.index, to: metro.index, distanceMeters: distance, durationSeconds });
  }
}
const validFrom = stopIndex.metadata.feeds.map((feed) => feed.validFrom).sort().at(-1);
const validUntil = stopIndex.metadata.feeds.map((feed) => feed.validUntil).sort().at(0);
const metadata = {
  schemaVersion: 2,
  feedVersions: Object.fromEntries(stopIndex.metadata.feeds.map((feed) => [feed.agency, feed.feedVersion])),
  validFrom,
  validUntil,
  license: "ODbL-1.0",
  sources: stopIndex.metadata.feeds,
  recordBytes,
  connectionCount,
  tripCount: trips.length,
  stopCount: stopIndex.stops.length,
  searchableStopCount: stopIndex.metadata.searchableCount,
  maximumTime,
  plausibilityGate: {
    rejectedConnections: Object.values(rejectionByAgency).reduce((sum, item) => sum + item.rejectedConnections, 0),
    byAgency: rejectionByAgency,
  },
  footpaths,
  footpathPolicy: { maximumDistanceMeters: 250, assumedWalkingMetersPerSecond: 1.25, geometry: "great-circle straight-line estimate" },
  services,
  trips,
};
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, "transit-connections.bin.gz"), compressed);
await writeFile(path.join(outputDirectory, "transit-connections.meta.json"), `${JSON.stringify(metadata)}\n`);
console.log(`Wrote ${connectionCount} bus + Metro connections and ${footpaths.length} directed transfer footpaths (${binary.length} raw / ${compressed.length} gzip bytes); rejected ${metadata.plausibilityGate.rejectedConnections} implausible connections`);
