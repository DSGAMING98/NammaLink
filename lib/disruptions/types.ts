import type { Coordinate, Journey, JourneyPreference, TransitLeg } from "@/lib/transit/types";

export type IncidentState = "unverified" | "suspected" | "corroborated" | "verified" | "expired" | "rejected";

export interface DisruptionIncident {
  id: string;
  title: string;
  state: IncidentState;
  simulated: boolean;
  reportedAt: string;
  expiresAt: string;
  affectedTripIds: string[];
  affectedRouteIds: string[];
  affectedStopIds: string[];
}

export interface ReportEvidence {
  ageMinutes: number;
  independentReports: number;
  gpsAccuracyMeters?: number;
  moderatorConfirmed: boolean;
  conflictingEvidence: boolean;
  expired: boolean;
  rejected: boolean;
}

export interface JourneyContract {
  arrivalDeadline: string;
  maxWalkingMeters: number;
  maxTransfers: number;
  preference: JourneyPreference;
  safetyBufferMinutes?: number;
}

export interface RecoveryRequest {
  activeJourney: Journey;
  completedLegCount: number;
  currentLocation: Coordinate;
  currentTime: string;
  destination: Coordinate;
  serviceDate: string;
  contract: JourneyContract;
  incidents: DisruptionIncident[];
}

export interface RecoveryResult {
  status: "unaffected" | "recovered" | "deadline_at_risk" | "no_alternative";
  preservedLegs: TransitLeg[];
  invalidatedLegs: TransitLeg[];
  blockingIncidents: DisruptionIncident[];
  continuation: Journey | null;
  deadlineStillPossible: boolean;
  relaxedConstraints: string[];
  message: string;
}
