import { describe, expect, it } from "vitest";
import { POST } from "./route";

const validRequest = {
  origin: { lat: 12.6418114, lon: 77.4404762 },
  destination: { lat: 12.7297587, lon: 77.7087603 },
  serviceDate: "2026-10-29",
  arriveBy: "10:05:00",
  safetyBufferMinutes: 0,
  maxWalkingMeters: 800,
  maxTransfers: 1,
  preference: "fastest",
};

describe("journey API", () => {
  it("returns scheduled results with provenance", async () => {
    const response = await POST(new Request("http://localhost/api/journeys", {
      method: "POST",
      body: JSON.stringify(validRequest),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.journeys.length).toBeGreaterThan(0);
    expect(body.journeys[0].source).toBe("scheduled");
    expect(body.network.version).toBe("20260907");
  });

  it("rejects invalid constraints", async () => {
    const response = await POST(new Request("http://localhost/api/journeys", {
      method: "POST",
      body: JSON.stringify({ ...validRequest, maxWalkingMeters: -1 }),
    }));

    expect(response.status).toBe(400);
  });
});
