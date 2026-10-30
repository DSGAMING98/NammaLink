import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

const feeds = [
  { agency: "BMTC", mode: "bus", directory: path.resolve(process.env.BMTC_GTFS_DIR ?? "../bmtc"), idPrefix: "", source: "Vonter/bmtc-gtfs community static GTFS" },
  { agency: "BMRCL", mode: "metro", directory: path.resolve(process.env.BMRCL_GTFS_DIR ?? "../bmrcl"), idPrefix: "metro:", source: "Vonter/bmrcl-gtfs community static GTFS derived from BMRCL and OSM" },
];
const outputPath = path.resolve("data/transit-stops.json");

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

async function readCsv(filePath) {
  const rows = [];
  const lines = readline.createInterface({ input: createReadStream(filePath, { encoding: "utf8" }), crlfDelay: Infinity });
  let headers;
  for await (const line of lines) {
    if (!headers) { headers = parseCsvLine(line.replace(/^\uFEFF/, "")); continue; }
    const values = parseCsvLine(line);
    rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
  }
  return rows;
}

function parseFeedInfo(text) {
  const [header, row] = text.trim().split(/\r?\n/).map(parseCsvLine);
  return Object.fromEntries(header.map((key, index) => [key, row[index] ?? ""]));
}
const isoDate = (value) => `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;

const stops = [];
const feedMetadata = [];
for (const feed of feeds) {
  const sourcePath = path.join(feed.directory, "stops.txt");
  const rows = await readCsv(sourcePath);
  const byId = new Map(rows.map((row) => [row.stop_id, row]));
  const platformIdsByStation = new Map();
  if (feed.mode === "metro") {
    for (const row of rows) {
      if (!row.parent_station || row.location_type) continue;
      const ids = platformIdsByStation.get(row.parent_station) ?? [];
      ids.push(`${feed.idPrefix}${row.stop_id}`);
      platformIdsByStation.set(row.parent_station, ids);
    }
  }

  for (const row of rows) {
    const lat = Number(row.stop_lat);
    const lon = Number(row.stop_lon);
    if (!row.stop_id || !row.stop_name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (feed.mode === "metro" && row.location_type === "2") continue;
    const isStation = feed.mode === "metro" && row.location_type === "1";
    const isPlatform = feed.mode === "metro" && !row.location_type;
    if (feed.mode === "metro" && !isStation && !isPlatform) continue;
    const parent = isPlatform ? byId.get(row.parent_station) : undefined;
    stops.push({
      id: `${feed.idPrefix}${row.stop_id}`,
      name: isStation ? `${row.stop_name} Metro` : parent ? `${parent.stop_name} Metro · Platform ${row.platform_code || ""}`.trim() : row.stop_name,
      lat,
      lon,
      agency: feed.agency,
      mode: feed.mode,
      searchable: !isPlatform,
      ...(isStation ? { routableStopIds: (platformIdsByStation.get(row.stop_id) ?? []).sort() } : {}),
      ...(isPlatform ? { parentId: `${feed.idPrefix}${row.parent_station}` } : {}),
    });
  }

  const sourceBytes = await readFile(sourcePath);
  const feedInfo = parseFeedInfo(await readFile(path.join(feed.directory, "feed_info.txt"), "utf8"));
  feedMetadata.push({ agency: feed.agency, mode: feed.mode, feedVersion: feedInfo.feed_version || "unknown", validFrom: isoDate(feedInfo.feed_start_date), validUntil: isoDate(feedInfo.feed_end_date), source: feed.source, license: "ODbL-1.0", sourceSha256: createHash("sha256").update(sourceBytes).digest("hex") });
}

stops.sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
const payload = {
  metadata: { name: "NammaLink BMTC + BMRCL compact stop index", license: "ODbL-1.0", count: stops.length, searchableCount: stops.filter((stop) => stop.searchable).length, feeds: feedMetadata },
  stops,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload)}\n`);
console.log(`Wrote ${payload.metadata.searchableCount} searchable stops and ${stops.length} routing nodes to ${outputPath}`);
