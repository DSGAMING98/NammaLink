import { planJourneys } from "@/lib/transit/router";
import type { PlanRequest, TransitNetwork } from "@/lib/transit/types";
import type { DisruptionIncident, IncidentState, RecoveryRequest, RecoveryResult, ReportEvidence } from "./types";

export function assessReport(evidence: ReportEvidence): { state: IncidentState; score: number } {
  if (evidence.rejected) return { state: "rejected", score: 0 };
  if (evidence.expired || evidence.ageMinutes > 180) return { state: "expired", score: 0 };

  let score = 0;
  score += evidence.ageMinutes <= 30 ? 2 : evidence.ageMinutes <= 90 ? 1 : 0;
  score += Math.min(3, evidence.independentReports);
  score += evidence.gpsAccuracyMeters !== undefined && evidence.gpsAccuracyMeters <= 50 ? 1 : 0;
  score += evidence.moderatorConfirmed ? 4 : 0;
  score -= evidence.conflictingEvidence ? 3 : 0;
  score = Math.max(0, score);

  if (evidence.moderatorConfirmed && score >= 5) return { state: "verified", score };
  if (score >= 5) return { state: "corroborated", score };
  if (score >= 3) return { state: "suspected", score };
  return { state: "unverified", score };
}

function incidentAffectsLeg(incident: DisruptionIncident, tripId: string, routeId: string, stopIds: string[]): boolean {
  if (incident.state !== "verified") return false;
  return (
    incident.affectedTripIds.includes(tripId) ||
    incident.affectedRouteIds.includes(routeId) ||
    stopIds.some((stopId) => incident.affectedStopIds.includes(stopId))
  );
}

export function recoverJourney(network: TransitNetwork, request: RecoveryRequest): RecoveryResult {
  const preservedLegs = request.activeJourney.legs.slice(0, request.completedLegCount);
  const remainingLegs = request.activeJourney.legs.slice(request.completedLegCount);
  const blockingIncidents = request.incidents.filter((incident) =>
    remainingLegs.some((leg) => incidentAffectsLeg(
      incident,
      leg.tripId,
      leg.routeId,
      [leg.boardStop.id, leg.alightStop.id],
    )),
  );
  const invalidatedLegs = remainingLegs.filter((leg) =>
    blockingIncidents.some((incident) => incidentAffectsLeg(
      incident,
      leg.tripId,
      leg.routeId,
      [leg.boardStop.id, leg.alightStop.id],
    )),
  );

  if (blockingIncidents.length === 0) {
    return {
      status: "unaffected",
      preservedLegs,
      invalidatedLegs: [],
      blockingIncidents: [],
      continuation: null,
      deadlineStillPossible: request.activeJourney.deadlineMet,
      relaxedConstraints: [],
      message: "No verified incident affects the remaining scheduled legs.",
    };
  }

  const excludedTripIds = new Set<string>();
  for (const incident of blockingIncidents) {
    incident.affectedTripIds.forEach((tripId) => excludedTripIds.add(tripId));
    if (incident.affectedRouteIds.length > 0) {
      network.trips
        .filter((trip) => incident.affectedRouteIds.includes(trip.routeId))
        .forEach((trip) => excludedTripIds.add(trip.id));
    }
  }

  const basePlan: PlanRequest = {
    origin: request.currentLocation,
    destination: request.destination,
    serviceDate: request.serviceDate,
    departAfter: request.currentTime,
    safetyBufferMinutes: request.contract.safetyBufferMinutes ?? 0,
    maxWalkingMeters: request.contract.maxWalkingMeters,
    maxTransfers: request.contract.maxTransfers,
    preference: request.contract.preference,
    excludedTripIds: [...excludedTripIds],
    searchHorizonMinutes: 300,
  };

  const strictResult = planJourneys(network, {
    ...basePlan,
    arrivalDeadline: request.contract.arrivalDeadline,
  });
  if (strictResult.journeys.length > 0) {
    return {
      status: "recovered",
      preservedLegs,
      invalidatedLegs,
      blockingIncidents,
      continuation: strictResult.journeys[0],
      deadlineStillPossible: true,
      relaxedConstraints: [],
      message: "A scheduled continuation still satisfies the original Journey Contract.",
    };
  }

  const relaxedResult = planJourneys(network, basePlan);
  if (relaxedResult.journeys.length > 0) {
    return {
      status: "deadline_at_risk",
      preservedLegs,
      invalidatedLegs,
      blockingIncidents,
      continuation: relaxedResult.journeys[0],
      deadlineStillPossible: false,
      relaxedConstraints: ["arrival_deadline"],
      message: "The original deadline can no longer be met on the bounded schedule. This is the next feasible continuation.",
    };
  }

  return {
    status: "no_alternative",
    preservedLegs,
    invalidatedLegs,
    blockingIncidents,
    continuation: null,
    deadlineStillPossible: false,
    relaxedConstraints: [],
    message: "No scheduled continuation was found within the bounded network and current constraints.",
  };
}
