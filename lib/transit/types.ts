export type TransitMode = "bus" | "metro";

export interface Coordinate {
  lat: number;
  lon: number;
}

export interface TransitStop extends Coordinate {
  id: string;
  name: string;
  description?: string;
}

export interface TransitRoute {
  id: string;
  shortName: string;
  longName: string;
  operator: string;
  mode: TransitMode;
}

export interface StopTime {
  stopId: string;
  arrival: string;
  departure: string;
  sequence: number;
}

export interface TransitTrip {
  id: string;
  routeId: string;
  serviceId: string;
  headsign: string;
  directionId: string;
  stopTimes: StopTime[];
}

export interface ServiceCalendar {
  service_id: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  start_date: string;
  end_date: string;
}

export interface TransitNetwork {
  metadata?: Record<string, unknown>;
  stops: TransitStop[];
  routes: TransitRoute[];
  trips: TransitTrip[];
  calendars?: ServiceCalendar[];
}

export type JourneyPreference =
  | "fastest"
  | "least_waiting"
  | "least_walking"
  | "direct_preferred"
  | "direct_only";

export interface PlanRequest {
  origin: Coordinate;
  destination: Coordinate;
  serviceDate: string;
  departAfter?: string;
  arriveBy?: string;
  safetyBufferMinutes?: number;
  maxWalkingMeters: number;
  maxTransfers: number;
  preference: JourneyPreference;
  searchHorizonMinutes?: number;
}

export interface TransitLeg {
  tripId: string;
  routeId: string;
  routeShortName: string;
  operator: string;
  mode: TransitMode;
  headsign: string;
  boardStop: TransitStop;
  alightStop: TransitStop;
  departureSeconds: number;
  arrivalSeconds: number;
}

export interface Journey {
  id: string;
  departureSeconds: number;
  arrivalSeconds: number;
  durationSeconds: number;
  waitingSeconds: number;
  walkingMeters: number;
  walkingSeconds: number;
  transfers: number;
  legs: TransitLeg[];
  deadlineMet: boolean;
  source: "scheduled";
  estimatedFare: null;
  explanation: string;
}

export interface PlanResult {
  journeys: Journey[];
  rejected: {
    directOnly: number;
    deadline: number;
    walking: number;
  };
  diagnostics: {
    exploredBoardings: number;
    truncated: boolean;
    dataSource: "scheduled";
  };
  message?: string;
}
