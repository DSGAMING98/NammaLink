import "server-only";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "CONFIGURATION_ERROR"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "UPSTREAM_TIMEOUT";

export function requestId(request: Request): string {
  const supplied = request.headers.get("x-request-id")?.trim();
  return supplied && /^[a-zA-Z0-9._-]{1,80}$/.test(supplied)
    ? supplied
    : crypto.randomUUID();
}

export function jsonResponse(body: unknown, status = 200, id?: string): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(id ? { "X-Request-Id": id } : {}),
    },
  });
}

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  id: string,
  retryable = false,
): Response {
  return jsonResponse({ error: { code, message, retryable, requestId: id } }, status, id);
}

export function upstreamError(error: unknown, id: string): Response {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return errorResponse("UPSTREAM_TIMEOUT", "The map provider timed out. Please retry.", 504, id, true);
  }
  console.error(JSON.stringify({ event: "upstream_request_failed", requestId: id, message: error instanceof Error ? error.message : "Unknown failure" }));
  return errorResponse("UPSTREAM_ERROR", "The map provider is temporarily unavailable.", 502, id, true);
}
