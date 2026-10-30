import "server-only";
import { z } from "zod";
import { clientKey, consumeRateLimit } from "./rate-limit";
import { errorResponse, requestId, upstreamError } from "./api-response";

export async function guardedMapsRequest(request: Request, action: (id: string) => Promise<Response>): Promise<Response> {
  const id = requestId(request);
  const rate = consumeRateLimit(`${clientKey(request)}:${new URL(request.url).pathname}`);
  if (!rate.allowed) {
    const response = errorResponse("RATE_LIMITED", "Too many map requests. Please retry shortly.", 429, id, true);
    response.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return response;
  }
  try {
    return await action(id);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse("BAD_REQUEST", error.issues[0]?.message || "Invalid request.", 400, id);
    if (error instanceof Error && error.message.startsWith("Missing GOOGLE_")) {
      return errorResponse("CONFIGURATION_ERROR", "This map capability is not configured.", 503, id);
    }
    return upstreamError(error, id);
  }
}

export const coordinateSchema = z.object({ latitude: z.number().gte(-90).lte(90), longitude: z.number().gte(-180).lte(180) });
