import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/airport", () => {
  it("returns scheduled airport routes", async () => {
    const response = GET(new Request("http://localhost/api/airport?mode=to_airport&date=2026-10-31&after=08:00&q=Silk%20Board"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.routes.some((route: { route: string }) => route.route.startsWith("KIA-8"))).toBe(true);
    expect(body.metadata.realtime).toBe(false);
  });

  it("rejects incomplete location coordinates", () => {
    expect(GET(new Request("http://localhost/api/airport?mode=to_airport&date=2026-10-31&after=08:00&lat=12.9")).status).toBe(400);
  });
});
