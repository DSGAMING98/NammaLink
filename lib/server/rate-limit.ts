import "server-only";

type Entry = { count: number; resetAt: number };
const entries = new Map<string, Entry>();

export function consumeRateLimit(key: string, limit = 60, windowMs = 60_000): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const current = entries.get(key);
  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  current.count += 1;
  if (entries.size > 2_000) {
    for (const [entryKey, entry] of entries) if (entry.resetAt <= now) entries.delete(entryKey);
  }
  return { allowed: current.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)) };
}

export function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}
