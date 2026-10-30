import metadata from "@/data/transit-connections.meta.json";
import { jsonResponse, requestId } from "@/lib/server/api-response";
import { googleCapabilities } from "@/lib/server/google-maps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const id = requestId(request);
  return jsonResponse({
    status: "ok",
    service: "nammalink-api",
    version: process.env.npm_package_version || "0.1.0",
    revision: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "development",
    timestamp: new Date().toISOString(),
    network: { connectionCount: metadata.connectionCount, stopCount: metadata.stopCount, validFrom: metadata.validFrom, validUntil: metadata.validUntil },
    capabilities: { scheduleRouting: true, stopSearch: true, ...googleCapabilities() },
  }, 200, id);
}
