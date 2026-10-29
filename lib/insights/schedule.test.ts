import { describe, expect, it } from "vitest";
import demoNetwork from "@/data/demo-network.json";
import type { TransitNetwork } from "@/lib/transit/types";
import { analyzeSchedule } from "./schedule";

describe("operator schedule insights", () => {
  const insights = analyzeSchedule(demoNetwork as TransitNetwork);

  it("reports fixture coverage without calling it fleet utilization", () => {
    expect(insights).toMatchObject({ totalTrips: 53, totalStops: 216, scope: "bounded_schedule" });
    expect(insights.routes.reduce((total, route) => total + route.trips, 0)).toBe(53);
  });

  it("computes transparent frequency summaries", () => {
    const route = insights.routes.find((item) => item.routeId === "8931");
    expect(route?.trips).toBe(32);
    expect(route?.medianHeadwayMinutes).toBeGreaterThan(0);
    expect(route?.servedStops).toBeGreaterThan(10);
  });
});
