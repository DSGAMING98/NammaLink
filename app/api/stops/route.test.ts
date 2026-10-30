import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/stops", () => {
  it("returns text search results with provenance", async () => {
    const response = GET(new Request("http://localhost/api/stops?q=kempegowda&limit=3"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.searchMode).toBe("text");
    expect(body.stops.length).toBeGreaterThan(0);
    expect(body.stops.length).toBeLessThanOrEqual(3);
    expect(body.provenance.indexedStops).toBe(10_043);
  });

  it("returns distance-labelled nearby stops", async () => {
    const response = GET(new Request("http://localhost/api/stops?lat=12.9779&lon=77.5724&radiusMeters=2000&limit=5"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.searchMode).toBe("nearby");
    expect(body.stops.length).toBeGreaterThan(0);
    expect(body.stops.length).toBeLessThanOrEqual(5);
    expect(body.stops.every((stop: { distanceMeters: number }) => stop.distanceMeters >= 0 && stop.distanceMeters <= 2_000)).toBe(true);
    expect(body.stops.map((stop: { distanceMeters: number }) => stop.distanceMeters)).toEqual(
      [...body.stops].map((stop: { distanceMeters: number }) => stop.distanceMeters).sort((left: number, right: number) => left - right),
    );
  });

  it("rejects incomplete or invalid coordinates", async () => {
    expect(GET(new Request("http://localhost/api/stops?lat=12.9")).status).toBe(400);
    expect(GET(new Request("http://localhost/api/stops?lat=91&lon=77")).status).toBe(400);
    expect(GET(new Request("http://localhost/api/stops?lat=x&lon=77")).status).toBe(400);
    expect(GET(new Request("http://localhost/api/stops?lat=12.9&lon=77&radiusMeters=-1")).status).toBe(400);
  });
});
