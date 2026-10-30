import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import metadata from "@/data/bmtc-connections.meta.json";
import type { ConnectionIndex } from "./connection-router";

const gunzipAsync = promisify(gunzip);
let cached: Promise<ConnectionIndex> | undefined;

export function loadFullConnectionIndex(): Promise<ConnectionIndex> {
  cached ??= readFile(path.join(process.cwd(), "data", "bmtc-connections.bin.gz"))
    .then((compressed) => gunzipAsync(compressed))
    .then((data) => ({
      data,
      recordBytes: metadata.recordBytes,
      connectionCount: metadata.connectionCount,
      stopCount: metadata.stopCount,
    }));
  return cached;
}
