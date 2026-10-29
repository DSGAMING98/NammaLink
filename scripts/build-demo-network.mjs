import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

const selectedRouteIds = new Set(["8931", "2704", "8950"]);
const sourceDirectory = path.resolve(process.env.BMTC_GTFS_DIR ?? "../bmtc");
const outputPath = path.resolve("data/demo-network.json");

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += character;
    }
  }

  cells.push(cell);
  return cells;
}

async function scanCsv(fileName, onRow) {
  const input = createReadStream(path.join(sourceDirectory, fileName), { encoding: "utf8" });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  let headers;

  for await (const line of lines) {
    if (!headers) {
      headers = parseCsvLine(line.replace(/^\uFEFF/, ""));
      continue;
    }

    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    await onRow(row);
  }
}

function numeric(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Expected a number, received ${value}`);
  return number;
}

const routes = [];
await scanCsv("routes.txt", (row) => {
  if (selectedRouteIds.has(row.route_id)) {
    routes.push({
      id: row.route_id,
      shortName: row.route_short_name,
      longName: row.route_long_name,
      operator: "BMTC",
      mode: "bus",
    });
  }
});

if (routes.length !== selectedRouteIds.size) {
  throw new Error(`Expected ${selectedRouteIds.size} selected routes, found ${routes.length}`);
}

const trips = [];
const tripIds = new Set();
await scanCsv("trips.txt", (row) => {
  if (selectedRouteIds.has(row.route_id)) {
    tripIds.add(row.trip_id);
    trips.push({
      id: row.trip_id,
      routeId: row.route_id,
      serviceId: row.service_id,
      headsign: row.trip_headsign,
      directionId: row.direction_id,
      stopTimes: [],
    });
  }
});

const tripsById = new Map(trips.map((trip) => [trip.id, trip]));
const stopIds = new Set();
await scanCsv("stop_times.txt", (row) => {
  if (!tripIds.has(row.trip_id)) return;
  stopIds.add(row.stop_id);
  tripsById.get(row.trip_id).stopTimes.push({
    stopId: row.stop_id,
    arrival: row.arrival_time,
    departure: row.departure_time,
    sequence: numeric(row.stop_sequence),
  });
});

for (const trip of trips) {
  trip.stopTimes.sort((left, right) => left.sequence - right.sequence);
}

const stops = [];
await scanCsv("stops.txt", (row) => {
  if (stopIds.has(row.stop_id)) {
    stops.push({
      id: row.stop_id,
      name: row.stop_name,
      description: row.stop_desc,
      lat: numeric(row.stop_lat),
      lon: numeric(row.stop_lon),
    });
  }
});

const calendars = [];
const serviceIds = new Set(trips.map((trip) => trip.serviceId));
await scanCsv("calendar.txt", (row) => {
  if (serviceIds.has(row.service_id)) calendars.push(row);
});

const feedInfoText = await readFile(path.join(sourceDirectory, "feed_info.txt"), "utf8");
const [feedHeadersLine, feedValuesLine] = feedInfoText.trim().split(/\r?\n/);
const feedHeaders = parseCsvLine(feedHeadersLine);
const feedValues = parseCsvLine(feedValuesLine);
const feedInfo = Object.fromEntries(feedHeaders.map((header, index) => [header, feedValues[index] ?? ""]));

const network = {
  metadata: {
    name: "NammaLink BMTC bounded demonstration network",
    source: feedInfo.feed_publisher_url,
    publisher: feedInfo.feed_publisher_name,
    version: feedInfo.feed_version,
    validFrom: feedInfo.feed_start_date,
    validUntil: feedInfo.feed_end_date,
    license: "ODbL-1.0",
    licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
    selectedRouteIds: [...selectedRouteIds],
    limitations: [
      "Static, unofficial community GTFS; not a live vehicle feed.",
      "Bounded fixture includes only selected routes used by the central demonstration.",
      "Schedule adherence and service operation are not independently verified.",
    ],
  },
  routes: routes.sort((left, right) => left.id.localeCompare(right.id)),
  stops: stops.sort((left, right) => left.id.localeCompare(right.id)),
  trips: trips.sort((left, right) => left.id.localeCompare(right.id)),
  calendars,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(network, null, 2)}\n`, "utf8");

const stopTimeCount = trips.reduce((total, trip) => total + trip.stopTimes.length, 0);
console.log(JSON.stringify({ outputPath, routes: routes.length, stops: stops.length, trips: trips.length, stopTimes: stopTimeCount }));
