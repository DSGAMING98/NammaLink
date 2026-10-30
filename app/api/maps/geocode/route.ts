import { jsonResponse } from "@/lib/server/api-response";
import { geocodeAddress } from "@/lib/server/google-maps";
import { guardedMapsRequest } from "@/lib/server/maps-route";
import { z } from "zod";

const querySchema = z.string().trim().min(2).max(200);
export const runtime = "nodejs";

export function GET(request: Request) {
  return guardedMapsRequest(request, async (id) => {
    const query = querySchema.parse(new URL(request.url).searchParams.get("q") || "");
    return jsonResponse({ results: await geocodeAddress(query) }, 200, id);
  });
}
