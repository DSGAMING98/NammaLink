import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

const sourceDirectory = path.resolve(process.env.BMTC_GTFS_DIR ?? "../bmtc");
const sourcePath = path.join(sourceDirectory, "stops.txt");
const outputPath = path.resolve("data/bmtc-stops.json");

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
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += character;
  }
  cells.push(cell);
  return cells;
}

const stops = [];
const input = createReadStream(sourcePath, { encoding: "utf8" });
const lines = readline.createInterface({ input, crlfDelay: Infinity });
let headers;
for await (const line of lines) {
  if (!headers) {
    headers = parseCsvLine(line.replace(/^\uFEFF/, ""));
    continue;
  }
  const values = parseCsvLine(line);
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  const lat = Number(row.stop_lat);
  const lon = Number(row.stop_lon);
  if (!row.stop_id || !row.stop_name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  stops.push({ id: row.stop_id, name: row.stop_name, lat, lon });
}

stops.sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
const sourceBytes = await readFile(sourcePath);
const feedInfo = await readFile(path.join(sourceDirectory, "feed_info.txt"), "utf8");
const feedVersion = feedInfo.match(/\n[^\n]*?(\d{8})[^\n]*$/m)?.[1] ?? "unknown";
const payload = {
  metadata: {
    name: "BMTC compact stop index",
    feedVersion,
    source: "Vonter/bmtc-gtfs community static GTFS",
    license: "ODbL-1.0",
    sourceSha256: createHash("sha256").update(sourceBytes).digest("hex"),
    count: stops.length,
  },
  stops,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload)}\n`);
console.log(`Wrote ${stops.length} stops to ${outputPath}`);
