import { describe, expect, it } from "vitest";
import { analyzeFullNetworkSupply } from "./full-network";

describe("full-network supply insights", () => {
  it("aggregates and deterministically ranks scheduled trips", () => {
    const result = analyzeFullNetworkSupply([
      { routeId: "b", route: "B" }, { routeId: "a", route: "A" }, { routeId: "b", route: "B" },
    ]);
    expect(result).toMatchObject({ totalTrips: 3, totalRoutes: 2, maximumTrips: 2 });
    expect(result.routes.map((route) => [route.route, route.trips])).toEqual([["B", 2], ["A", 1]]);
  });
});
