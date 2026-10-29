import { compactDate, formatServiceTime, parseGtfsTime, serviceDayName } from "./time";
import type {
  Coordinate,
  Journey,
  PlanRequest,
  PlanResult,
  ServiceCalendar,
  TransitLeg,
  TransitNetwork,
  TransitStop,
  TransitTrip,
} from "./types";

const WALKING_METERS_PER_SECOND = 1.25;
const TRANSFER_BUFFER_SECONDS = 120;
const TRANSFER_RADIUS_METERS = 400;
const MAX_TRANSFER_WAIT_SECONDS = 90 * 60;
const MAX_EXPLORED_BOARDINGS = 40_000;
const MAX_RESULTS = 12;

interface IndexedStopTime {
  trip: TransitTrip;
  index: number;
  departureSeconds: number;
}

interface SearchContext {
  legs: TransitLeg[];
  walkingMeters: number;
  walkingSeconds: number;
  waitingSeconds: number;
  originDepartureSeconds: number;
  visitedTrips: Set<string>;
}

export function distanceMeters(left: Coordinate, right: Coordinate): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const latitudeDelta = radians(right.lat - left.lat);
  const longitudeDelta = radians(right.lon - left.lon);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(left.lat)) * Math.cos(radians(right.lat)) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export function nearbyStops(stops: TransitStop[], coordinate: Coordinate, radiusMeters: number): Array<{ stop: TransitStop; distance: number }> {
  return stops
    .map((stop) => ({ stop, distance: distanceMeters(stop, coordinate) }))
    .filter(({ distance }) => distance <= radiusMeters)
    .sort((left, right) => left.distance - right.distance);
}

export function serviceRuns(calendar: ServiceCalendar, serviceDate: string): boolean {
  const compact = compactDate(serviceDate);
  const day = serviceDayName(serviceDate);
  return compact >= calendar.start_date && compact <= calendar.end_date && calendar[day] === "1";
}

function journeyExplanation(journey: Journey, preference: PlanRequest["preference"]): string {
  if (journey.transfers === 0) return `Direct scheduled option with ${Math.round(journey.walkingMeters)} m of walking.`;
  if (preference === "least_walking") return `Selected for lower walking; includes ${journey.transfers} transfer${journey.transfers === 1 ? "" : "s"}.`;
  if (preference === "least_waiting") return `Selected for ${Math.round(journey.waitingSeconds / 60)} minutes of scheduled waiting.`;
  return `${journey.transfers} transfer${journey.transfers === 1 ? "" : "s"}; scheduled arrival ${formatServiceTime(journey.arrivalSeconds)}.`;
}

function rankJourneys(journeys: Journey[], preference: PlanRequest["preference"]): Journey[] {
  const score = (journey: Journey): number[] => {
    switch (preference) {
      case "least_waiting":
        return [journey.waitingSeconds, journey.durationSeconds, journey.walkingMeters];
      case "least_walking":
        return [journey.walkingMeters, journey.durationSeconds, journey.waitingSeconds];
      case "direct_only":
      case "direct_preferred":
        return [journey.transfers, journey.durationSeconds, journey.waitingSeconds];
      case "fastest":
      default:
        return [journey.durationSeconds, journey.arrivalSeconds, journey.waitingSeconds];
    }
  };

  return journeys.sort((left, right) => {
    const leftScore = score(left);
    const rightScore = score(right);
    for (let index = 0; index < leftScore.length; index += 1) {
      if (leftScore[index] !== rightScore[index]) return leftScore[index] - rightScore[index];
    }
    return left.id.localeCompare(right.id);
  });
}

function removeDominatedAndDuplicateJourneys(journeys: Journey[]): Journey[] {
  const unique = new Map<string, Journey>();
  for (const journey of journeys) {
    const signature = journey.legs.map((leg) => `${leg.tripId}:${leg.boardStop.id}-${leg.alightStop.id}`).join("|");
    const existing = unique.get(signature);
    if (!existing || journey.durationSeconds < existing.durationSeconds) unique.set(signature, journey);
  }

  const candidates = [...unique.values()];
  return candidates.filter((candidate) =>
    !candidates.some((other) =>
      other !== candidate &&
      other.durationSeconds <= candidate.durationSeconds &&
      other.waitingSeconds <= candidate.waitingSeconds &&
      other.walkingMeters <= candidate.walkingMeters &&
      other.transfers <= candidate.transfers &&
      (other.durationSeconds < candidate.durationSeconds ||
        other.waitingSeconds < candidate.waitingSeconds ||
        other.walkingMeters < candidate.walkingMeters ||
        other.transfers < candidate.transfers),
    ),
  );
}

export function planJourneys(network: TransitNetwork, request: PlanRequest): PlanResult {
  if ((request.departAfter ? 1 : 0) + (request.arriveBy ? 1 : 0) !== 1) {
    throw new Error("Provide exactly one of departAfter or arriveBy.");
  }
  if (request.maxWalkingMeters < 0 || request.maxTransfers < 0) throw new Error("Journey constraints cannot be negative.");

  const stopsById = new Map(network.stops.map((stop) => [stop.id, stop]));
  const routesById = new Map(network.routes.map((route) => [route.id, route]));
  const calendarsById = new Map((network.calendars ?? []).map((calendar) => [calendar.service_id, calendar]));
  const activeTrips = network.trips.filter((trip) => {
    const calendar = calendarsById.get(trip.serviceId);
    return !calendar || serviceRuns(calendar, request.serviceDate);
  });

  const departuresByStop = new Map<string, IndexedStopTime[]>();
  for (const trip of activeTrips) {
    trip.stopTimes.forEach((stopTime, index) => {
      const event = { trip, index, departureSeconds: parseGtfsTime(stopTime.departure) };
      const events = departuresByStop.get(stopTime.stopId) ?? [];
      events.push(event);
      departuresByStop.set(stopTime.stopId, events);
    });
  }
  for (const events of departuresByStop.values()) events.sort((left, right) => left.departureSeconds - right.departureSeconds);

  const requestedTime = parseGtfsTime(request.departAfter ?? request.arriveBy!);
  const safetySeconds = (request.safetyBufferMinutes ?? 0) * 60;
  const latestArrival = request.arriveBy ? requestedTime - safetySeconds : Number.POSITIVE_INFINITY;
  const horizonSeconds = (request.searchHorizonMinutes ?? 5 * 60) * 60;
  const searchStart = request.departAfter ? requestedTime : Math.max(0, latestArrival - horizonSeconds);
  const searchEnd = request.departAfter ? requestedTime + horizonSeconds : latestArrival;
  const accessStops = nearbyStops(network.stops, request.origin, request.maxWalkingMeters).slice(0, 12);
  const destinationDistances = new Map(network.stops.map((stop) => [stop.id, distanceMeters(stop, request.destination)]));
  const transferNeighbors = new Map<string, Array<{ stop: TransitStop; distance: number }>>();
  const journeys: Journey[] = [];
  let exploredBoardings = 0;
  let truncated = false;
  const rejected = { directOnly: 0, deadline: 0, walking: 0 };

  const neighborsFor = (stop: TransitStop) => {
    const cached = transferNeighbors.get(stop.id);
    if (cached) return cached;
    const neighbors = nearbyStops(network.stops, stop, TRANSFER_RADIUS_METERS);
    transferNeighbors.set(stop.id, neighbors);
    return neighbors;
  };

  const addJourney = (context: SearchContext, finalLeg: TransitLeg, egressDistance: number, transitArrival: number) => {
    const walkingMeters = context.walkingMeters + egressDistance;
    if (walkingMeters > request.maxWalkingMeters) {
      rejected.walking += 1;
      return;
    }
    const egressSeconds = egressDistance / WALKING_METERS_PER_SECOND;
    const arrivalSeconds = transitArrival + egressSeconds;
    if (arrivalSeconds > latestArrival) {
      rejected.deadline += 1;
      return;
    }
    const legs = [...context.legs, finalLeg];
    const transfers = legs.length - 1;
    if (request.preference === "direct_only" && transfers > 0) {
      rejected.directOnly += 1;
      return;
    }
    const journey: Journey = {
      id: legs.map((leg) => leg.tripId).join("-"),
      departureSeconds: context.originDepartureSeconds,
      arrivalSeconds,
      durationSeconds: arrivalSeconds - context.originDepartureSeconds,
      waitingSeconds: context.waitingSeconds,
      walkingMeters,
      walkingSeconds: context.walkingSeconds + egressSeconds,
      transfers,
      legs,
      deadlineMet: arrivalSeconds <= latestArrival,
      source: "scheduled",
      estimatedFare: null,
      explanation: "",
    };
    journey.explanation = journeyExplanation(journey, request.preference);
    journeys.push(journey);
  };

  const exploreTrip = (event: IndexedStopTime, context: SearchContext): void => {
    if (exploredBoardings >= MAX_EXPLORED_BOARDINGS) {
      truncated = true;
      return;
    }
    exploredBoardings += 1;
    const { trip, index: boardIndex } = event;
    const route = routesById.get(trip.routeId);
    const boardStop = stopsById.get(trip.stopTimes[boardIndex].stopId);
    if (!route || !boardStop) return;
    const departureSeconds = parseGtfsTime(trip.stopTimes[boardIndex].departure);

    for (let alightIndex = boardIndex + 1; alightIndex < trip.stopTimes.length; alightIndex += 1) {
      const alightTime = trip.stopTimes[alightIndex];
      const alightStop = stopsById.get(alightTime.stopId);
      if (!alightStop) continue;
      const arrivalSeconds = parseGtfsTime(alightTime.arrival);
      const leg: TransitLeg = {
        tripId: trip.id,
        routeId: route.id,
        routeShortName: route.shortName,
        operator: route.operator,
        mode: route.mode,
        headsign: trip.headsign,
        boardStop,
        alightStop,
        departureSeconds,
        arrivalSeconds,
      };

      const egressDistance = destinationDistances.get(alightStop.id) ?? Number.POSITIVE_INFINITY;
      if (egressDistance + context.walkingMeters <= request.maxWalkingMeters) {
        addJourney(context, leg, egressDistance, arrivalSeconds);
      }

      if (context.legs.length >= request.maxTransfers || truncated) continue;
      for (const neighbor of neighborsFor(alightStop)) {
        const walkingMeters = context.walkingMeters + neighbor.distance;
        if (walkingMeters > request.maxWalkingMeters) continue;
        const transferWalkingSeconds = neighbor.distance / WALKING_METERS_PER_SECOND;
        const readyAt = arrivalSeconds + transferWalkingSeconds + TRANSFER_BUFFER_SECONDS;
        const transferEvents = (departuresByStop.get(neighbor.stop.id) ?? [])
          .filter((nextEvent) =>
            nextEvent.departureSeconds >= readyAt &&
            nextEvent.departureSeconds <= Math.min(searchEnd, readyAt + MAX_TRANSFER_WAIT_SECONDS) &&
            !context.visitedTrips.has(nextEvent.trip.id),
          )
          .slice(0, 4);

        for (const nextEvent of transferEvents) {
          const nextContext: SearchContext = {
            legs: [...context.legs, leg],
            walkingMeters,
            walkingSeconds: context.walkingSeconds + transferWalkingSeconds,
            waitingSeconds: context.waitingSeconds + nextEvent.departureSeconds - arrivalSeconds - transferWalkingSeconds,
            originDepartureSeconds: context.originDepartureSeconds,
            visitedTrips: new Set([...context.visitedTrips, nextEvent.trip.id]),
          };
          exploreTrip(nextEvent, nextContext);
        }
      }
    }
  };

  for (const access of accessStops) {
    const accessWalkingSeconds = access.distance / WALKING_METERS_PER_SECOND;
    const earliestBoard = request.departAfter ? requestedTime + accessWalkingSeconds : searchStart + accessWalkingSeconds;
    const originEvents = (departuresByStop.get(access.stop.id) ?? []).filter(
      (event) => event.departureSeconds >= earliestBoard && event.departureSeconds <= searchEnd,
    );

    for (const event of originEvents) {
      const originDepartureSeconds = request.departAfter ? requestedTime : event.departureSeconds - accessWalkingSeconds;
      const waitingSeconds = request.departAfter ? event.departureSeconds - earliestBoard : 0;
      exploreTrip(event, {
        legs: [],
        walkingMeters: access.distance,
        walkingSeconds: accessWalkingSeconds,
        waitingSeconds,
        originDepartureSeconds,
        visitedTrips: new Set([event.trip.id]),
      });
    }
  }

  const filtered = request.preference === "direct_only" ? journeys.filter((journey) => journey.transfers === 0) : journeys;
  const paretoJourneys = removeDominatedAndDuplicateJourneys(filtered);
  const ranked = rankJourneys(paretoJourneys, request.preference).slice(0, MAX_RESULTS);

  let message: string | undefined;
  if (ranked.length === 0) {
    message = request.preference === "direct_only"
      ? "No direct scheduled journey satisfies the current constraints."
      : "No scheduled journey satisfies the current constraints and search window.";
  }

  return {
    journeys: ranked,
    rejected,
    diagnostics: { exploredBoardings, truncated, dataSource: "scheduled" },
    message,
  };
}
