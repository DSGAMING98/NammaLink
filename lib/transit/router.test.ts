import { describe, expect, it } from "vitest";
import { planJourneys, serviceRuns } from "./router";
import type { PlanRequest, TransitNetwork } from "./types";

const network: TransitNetwork = {
  stops: [
    { id: "A", name: "Origin", lat: 12, lon: 77 },
    { id: "B", name: "Transfer", lat: 12, lon: 77.01 },
    { id: "C", name: "Destination", lat: 12, lon: 77.02 },
    { id: "D", name: "Far destination stop", lat: 12, lon: 77.025 },
  ],
  routes: [
    { id: "slow", shortName: "S", longName: "Slow direct", operator: "Test", mode: "bus" },
    { id: "first", shortName: "1", longName: "First leg", operator: "Test", mode: "bus" },
    { id: "second", shortName: "2", longName: "Second leg", operator: "Test", mode: "bus" },
    { id: "far", shortName: "F", longName: "Far walk", operator: "Test", mode: "bus" },
  ],
  trips: [
    {
      id: "direct",
      routeId: "slow",
      serviceId: "daily",
      headsign: "Destination",
      directionId: "0",
      stopTimes: [
        { stopId: "A", arrival: "08:10:00", departure: "08:10:00", sequence: 1 },
        { stopId: "C", arrival: "09:00:00", departure: "09:00:00", sequence: 2 },
      ],
    },
    {
      id: "transfer-one",
      routeId: "first",
      serviceId: "daily",
      headsign: "Transfer",
      directionId: "0",
      stopTimes: [
        { stopId: "A", arrival: "08:20:00", departure: "08:20:00", sequence: 1 },
        { stopId: "B", arrival: "08:30:00", departure: "08:30:00", sequence: 2 },
      ],
    },
    {
      id: "transfer-two",
      routeId: "second",
      serviceId: "daily",
      headsign: "Destination",
      directionId: "0",
      stopTimes: [
        { stopId: "B", arrival: "08:35:00", departure: "08:35:00", sequence: 1 },
        { stopId: "C", arrival: "08:50:00", departure: "08:50:00", sequence: 2 },
      ],
    },
    {
      id: "too-much-walking",
      routeId: "far",
      serviceId: "daily",
      headsign: "Far stop",
      directionId: "0",
      stopTimes: [
        { stopId: "A", arrival: "08:05:00", departure: "08:05:00", sequence: 1 },
        { stopId: "D", arrival: "08:25:00", departure: "08:25:00", sequence: 2 },
      ],
    },
  ],
  calendars: [
    {
      service_id: "daily",
      monday: "1",
      tuesday: "1",
      wednesday: "1",
      thursday: "1",
      friday: "1",
      saturday: "1",
      sunday: "1",
      start_date: "20260101",
      end_date: "20271231",
    },
  ],
};

const baseRequest: PlanRequest = {
  origin: { lat: 12, lon: 77 },
  destination: { lat: 12, lon: 77.02 },
  serviceDate: "2026-10-29",
  departAfter: "08:00:00",
  maxWalkingMeters: 300,
  maxTransfers: 1,
  preference: "fastest",
};

describe("schedule router", () => {
  it("finds both a direct journey and a valid transfer journey", () => {
    const result = planJourneys(network, baseRequest);
    expect(result.journeys.some((journey) => journey.transfers === 0)).toBe(true);
    expect(result.journeys.some((journey) => journey.transfers === 1)).toBe(true);
  });

  it("rejects transfer journeys in direct-only mode", () => {
    const result = planJourneys(network, { ...baseRequest, preference: "direct_only" });
    expect(result.journeys).toHaveLength(1);
    expect(result.journeys[0].legs[0].tripId).toBe("direct");
  });

  it("returns no journey when the deadline is too strict", () => {
    const result = planJourneys(network, {
      ...baseRequest,
      departAfter: undefined,
      arriveBy: "08:40:00",
      safetyBufferMinutes: 5,
    });
    expect(result.journeys).toHaveLength(0);
    expect(result.message).toContain("No scheduled journey");
  });

  it("excludes a route whose final walk exceeds the hard limit", () => {
    const result = planJourneys(network, { ...baseRequest, maxWalkingMeters: 300 });
    expect(result.journeys.flatMap((journey) => journey.legs).some((leg) => leg.tripId === "too-much-walking")).toBe(false);
  });

  it("honours the GTFS service calendar", () => {
    expect(serviceRuns(network.calendars![0], "2026-10-29")).toBe(true);
    expect(serviceRuns(network.calendars![0], "2028-10-29")).toBe(false);
  });
});
