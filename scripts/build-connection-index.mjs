import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import path from "node:path";
import readline from "node:readline";

const gzipAsync = promisify(gzip);
const sourceDirectory = path.resolve(process.env.BMTC_GTFS_DIR ?? "../bmtc");
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

async function scanCsv(fileName, onRow) {
  const input = createReadStream(path.join(sourceDirectory, fileName), { encoding: "utf8" });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
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

const stopIndex = JSON.parse(await readFile(path.join(outputDirectory, "bmtc-stops.json"), "utf8"));
const stopNumber = new Map(stopIndex.stops.map((stop, index) => [stop.id, index]));
const radians = (degrees) => degrees * Math.PI / 180;
function distanceMeters(from, to) {
  const left = stopIndex.stops[from];
  const right = stopIndex.stops[to];
  const latitude = radians(right.lat - left.lat);
  const longitude = radians(right.lon - left.lon);
  const value = Math.sin(latitude / 2) ** 2 + Math.cos(radians(left.lat)) * Math.cos(radians(right.lat)) * Math.sin(longitude / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

const routeNames = new Map();
await scanCsv("routes.txt", (row) => routeNames.set(row.route_id, row.route_short_name || row.route_long_name || row.route_id));

const trips = [];
const tripNumber = new Map();
await scanCsv("trips.txt", (row) => {
  tripNumber.set(row.trip_id, trips.length);
  trips.push({ id: row.trip_id, routeId: row.route_id, route: routeNames.get(row.route_id), headsign: row.trip_headsign, direction: row.direction_id });
});

const previous = new Map();
const buckets = new Map();
let connectionCount = 0;
let rejectedImplausibleConnections = 0;
let maximumTime = 0;
await scanCsv("stop_times.txt", (row) => {
  const trip = tripNumber.get(row.trip_id);
  const stop = stopNumber.get(row.stop_id);
  if (trip === undefined || stop === undefined) return;
  const current = { stop, arrival: seconds(row.arrival_time), departure: seconds(row.departure_time), sequence: Number(row.stop_sequence) };
  const prior = previous.get(trip);
  if (prior && current.sequence > prior.sequence) {
    const duration = current.arrival - prior.departure;
    const speedMetersPerSecond = duration > 0 ? distanceMeters(prior.stop, current.stop) / duration : Number.POSITIVE_INFINITY;
    if (duration <= 0 || speedMetersPerSecond > 25) {
      rejectedImplausibleConnections += 1;
    } else {
      const bucket = buckets.get(prior.departure) ?? [];
      bucket.push(prior.departure, current.arrival, prior.stop, current.stop, trip);
      buckets.set(prior.departure, bucket);
      connectionCount += 1;
      maximumTime = Math.max(maximumTime, current.arrival);
    }
  }
  previous.set(trip, current);
});

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
const metadata = {
  schemaVersion: 1,
  feedVersion: stopIndex.metadata.feedVersion,
  validFrom: "2026-09-07",
  validUntil: "2027-09-07",
  license: "ODbL-1.0",
  source: stopIndex.metadata.source,
  recordBytes,
  connectionCount,
  tripCount: trips.length,
  stopCount: stopIndex.stops.length,
  maximumTime,
  plausibilityGate: { maximumSpeedMetersPerSecond: 25, rejectedConnections: rejectedImplausibleConnections },
  trips,
};
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, "bmtc-connections.bin.gz"), compressed);
await writeFile(path.join(outputDirectory, "bmtc-connections.meta.json"), `${JSON.stringify(metadata)}\n`);
console.log(`Wrote ${connectionCount} connections (${binary.length} raw / ${compressed.length} gzip bytes); rejected ${rejectedImplausibleConnections} implausible connections`);
