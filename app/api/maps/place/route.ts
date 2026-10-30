import { jsonResponse } from "@/lib/server/api-response";
import { geocodePlace } from "@/lib/server/google-maps";
import { guardedMapsRequest } from "@/lib/server/maps-route";
import { z } from "zod";

const placeSchema = z.string().trim().min(3).max(300);
export const runtime = "nodejs";

export function GET(request: Request) {
  return guardedMapsRequest(request, async (id) => {
    const placeId = placeSchema.parse(new URL(request.url).searchParams.get("placeId") || "");
    return jsonResponse({ place: await geocodePlace(placeId) }, 200, id);
  });
}
