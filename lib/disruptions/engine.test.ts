import { describe, expect, it } from "vitest";
import demoNetwork from "@/data/demo-network.json";
import { planJourneys } from "@/lib/transit/router";
import type { TransitNetwork } from "@/lib/transit/types";
import { assessReport, recoverJourney } from "./engine";
import type { DisruptionIncident } from "./types";

const network = demoNetwork as TransitNetwork;
const destination = { lat: 12.7297587, lon: 77.7087603 };
const activeJourney = planJourneys(network, {
  origin: { lat: 12.6418114, lon: 77.4404762 },
  destination,
  serviceDate: "2026-10-29",
  arriveBy: "10:05:00",
  maxWalkingMeters: 800,
  maxTransfers: 1,
  preference: "fastest",
  searchHorizonMinutes: 240,
}).journeys[0];

function incident(state: DisruptionIncident["state"]): DisruptionIncident {
  return {
    id: "demo-missed-connection",
    title: "Second bus unavailable",
    state,
    simulated: true,
    reportedAt: "2026-10-29T08:00:00+05:30",
    expiresAt: "2026-10-29T11:00:00+05:30",
    affectedTripIds: [activeJourney.legs[1].tripId],
    affectedRouteIds: [],
    affectedStopIds: [],
  };
}

describe("disruption evidence", () => {
  it("does not turn one fresh report into a verified incident", () => {
    expect(assessReport({
      ageMinutes: 10,
      independentReports: 1,
      gpsAccuracyMeters: 30,
      moderatorConfirmed: false,
      conflictingEvidence: false,
      expired: false,
      rejected: false,
    }).state).toBe("suspected");
  });

  it("allows strong corroboration and moderator confirmation to verify a report", () => {
    expect(assessReport({
      ageMinutes: 10,
      independentReports: 3,
      gpsAccuracyMeters: 20,
      moderatorConfirmed: true,
      conflictingEvidence: false,
      expired: false,
      rejected: false,
    }).state).toBe("verified");
  });
});

describe("journey recovery", () => {
  const recoveryBase = {
    activeJourney,
    completedLegCount: 1,
    currentLocation: { lat: 12.917407, lon: 77.57278 },
    currentTime: "08:00:00",
    destination,
    serviceDate: "2026-10-29",
    contract: {
      arrivalDeadline: "10:05:00",
      maxWalkingMeters: 800,
      maxTransfers: 1,
      preference: "fastest" as const,
    },
  };

  it("does not invalidate a journey from an unverified report", () => {
    const result = recoverJourney(network, { ...recoveryBase, incidents: [incident("unverified")] });
    expect(result.status).toBe("unaffected");
    expect(result.invalidatedLegs).toHaveLength(0);
  });

  it("preserves the completed leg and proposes the next trip after a verified simulated incident", () => {
    const result = recoverJourney(network, { ...recoveryBase, incidents: [incident("verified")] });
    expect(result.preservedLegs).toHaveLength(1);
    expect(result.invalidatedLegs).toHaveLength(1);
    expect(result.status).toBe("deadline_at_risk");
    expect(result.deadlineStillPossible).toBe(false);
    expect(result.continuation).not.toBeNull();
    expect(result.continuation?.legs[0].tripId).not.toBe(activeJourney.legs[1].tripId);
  });
});
