import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns a secret-safe readiness contract and request ID", async () => {
    const response = GET(new Request("https://nammalink.in/api/health", { headers: { "x-request-id": "health-test" } }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("health-test");
    expect(body.status).toBe("ok");
    expect(body.network.connectionCount).toBeGreaterThan(1_000_000);
    expect(body.capabilities.scheduleRouting).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/AIza/);
  });
});
