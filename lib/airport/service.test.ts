import { describe, expect, it } from "vitest";
import { queryAirportServices } from "./service";

describe("airport service discovery", () => {
  it("returns direction-correct scheduled KIA services with provenance", () => {
    const result = queryAirportServices({ mode: "to_airport", date: "2026-10-31", after: "08:00", latitude: 12.917, longitude: 77.623 });
    expect(result.routes.length).toBeGreaterThan(5);
    expect(result.routes.every((route) => route.direction === "to_airport")).toBe(true);
    expect(result.routes.every((route) => !/Electronic City KIA/i.test(route.destination.name))).toBe(true);
    expect(result.routes[0].stops.length).toBeGreaterThan(2);
    expect(result.metadata.realtime).toBe(false);
  });

  it("filters by a verified corridor and does not invent live arrivals", () => {
    const result = queryAirportServices({ mode: "from_airport", date: "2026-10-31", after: "08:00", query: "Electronic City" });
    expect(result.routes.some((route) => route.route.startsWith("KIA-8"))).toBe(true);
    expect(result.routes.every((route) => route.sourceStatus === "scheduled_static")).toBe(true);
  });
});
