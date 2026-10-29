import { describe, expect, it } from "vitest";
import demoNetwork from "@/data/demo-network.json";
import { planJourneys } from "./router";
import type { TransitNetwork } from "./types";

const centralRequest = {
  origin: { lat: 12.6418114, lon: 77.4404762 },
  destination: { lat: 12.7297587, lon: 77.7087603 },
  serviceDate: "2026-10-29",
  arriveBy: "10:05:00",
  maxWalkingMeters: 800,
  maxTransfers: 1,
  preference: "fastest" as const,
  searchHorizonMinutes: 240,
};

describe("bounded BMTC demonstration network", () => {
  it("finds the scheduled Jain Gate–Banashankari–Chikka Hagade connection", () => {
    const result = planJourneys(demoNetwork as TransitNetwork, centralRequest);
    const connection = result.journeys.find(
      (journey) => journey.legs[0]?.routeId === "8931" && journey.legs[1]?.routeId === "2704",
    );

    expect(connection).toBeDefined();
    expect(connection?.transfers).toBe(1);
    expect(connection?.walkingMeters).toBeLessThanOrEqual(800);
    expect(connection?.source).toBe("scheduled");
    expect(result.diagnostics.truncated).toBe(false);
  });

  it("honestly reports that no direct option exists in the bounded fixture", () => {
    const result = planJourneys(demoNetwork as TransitNetwork, {
      ...centralRequest,
      preference: "direct_only",
    });

    expect(result.journeys).toHaveLength(0);
    expect(result.message).toContain("No direct scheduled journey");
  });
});
