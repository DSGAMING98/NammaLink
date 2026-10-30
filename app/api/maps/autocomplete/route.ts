import { jsonResponse } from "@/lib/server/api-response";
import { autocompletePlaces } from "@/lib/server/google-maps";
import { guardedMapsRequest } from "@/lib/server/maps-route";
import { z } from "zod";

const querySchema = z.object({ input: z.string().trim().min(2).max(160), sessionToken: z.string().uuid().optional() });
export const runtime = "nodejs";

export function GET(request: Request) {
  return guardedMapsRequest(request, async (id) => {
    const url = new URL(request.url);
    const query = querySchema.parse({ input: url.searchParams.get("input") || "", sessionToken: url.searchParams.get("sessionToken") || undefined });
    return jsonResponse({ suggestions: await autocompletePlaces(query.input, query.sessionToken) }, 200, id);
  });
}
