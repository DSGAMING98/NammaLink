import { jsonResponse } from "@/lib/server/api-response";
import { walkingRoute } from "@/lib/server/google-maps";
import { coordinateSchema, guardedMapsRequest } from "@/lib/server/maps-route";

export const runtime = "nodejs";

export function POST(request: Request) {
  return guardedMapsRequest(request, async (id) => {
    const payload = await request.json().catch(() => ({}));
    const object = payload as { origin?: unknown; destination?: unknown };
    const origin = coordinateSchema.parse(object.origin);
    const destination = coordinateSchema.parse(object.destination);
    return jsonResponse({ routes: await walkingRoute(origin, destination) }, 200, id);
  });
}
