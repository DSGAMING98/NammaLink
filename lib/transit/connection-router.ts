export type ConnectionIndex = {
  data: Buffer;
  recordBytes: number;
  connectionCount: number;
  stopCount: number;
  tripCount?: number;
  footpaths?: Footpath[];
};

export type Footpath = { from: number; to: number; distanceMeters: number; durationSeconds: number };
export type ConnectionLeg = { from: number; to: number; departure: number; arrival: number; trip: number; distanceMeters?: number };
export type ConnectionScanOptions = { maximumWalkingMeters?: number; directOnly?: boolean };

const field = (index: number, recordBytes: number, fieldIndex: number) => index * recordBytes + fieldIndex * 4;

export function earliestArrival(index: ConnectionIndex, originInput: number | number[], destinationInput: number | number[], departAfter: number, minimumTransferSeconds = 0, activeTrips?: Uint8Array, options: ConnectionScanOptions = {}): ConnectionLeg[] | null {
  const origins = [...new Set(Array.isArray(originInput) ? originInput : [originInput])];
  const destinations = [...new Set(Array.isArray(destinationInput) ? destinationInput : [destinationInput])];
  if (origins.length === 0 || destinations.length === 0 || [...origins, ...destinations].some((stop) => stop < 0 || stop >= index.stopCount)) return null;
  const originSet = new Set(origins);
  if (destinations.some((destination) => originSet.has(destination))) return [];
  const earliest = new Uint32Array(index.stopCount);
  earliest.fill(0xffffffff);
  const walkingAtStop = new Uint32Array(index.stopCount);
  walkingAtStop.fill(0xffffffff);
  const transitUsedAtStop = new Uint8Array(index.stopCount);
  for (const origin of origins) earliest[origin] = departAfter;
  for (const origin of origins) walkingAtStop[origin] = 0;
  const predecessor = new Int32Array(index.stopCount);
  predecessor.fill(-1);
  const reachedTrip = new Uint8Array(index.tripCount ?? index.connectionCount);
  const lastTripConnection = new Int32Array(index.tripCount ?? index.connectionCount);
  lastTripConnection.fill(-1);
  const tripWalkingMeters = new Uint32Array(index.tripCount ?? index.connectionCount);
  const pathPrevious = new Int32Array(index.connectionCount);
  pathPrevious.fill(-1);
  const footpathsFrom = new Map<number, Footpath[]>();
  for (const footpath of index.footpaths ?? []) {
    const outgoing = footpathsFrom.get(footpath.from) ?? [];
    outgoing.push(footpath);
    footpathsFrom.set(footpath.from, outgoing);
  }
  const walkPrevious: number[] = [];
  const walkFrom: number[] = [];
  const walkTo: number[] = [];
  const walkDeparture: number[] = [];
  const walkArrival: number[] = [];
  const walkDistance: number[] = [];
  const addWalk = (previous: number, footpath: Footpath, departure: number, arrival: number) => {
    const walk = walkPrevious.length;
    walkPrevious.push(previous);
    walkFrom.push(footpath.from);
    walkTo.push(footpath.to);
    walkDeparture.push(departure);
    walkArrival.push(arrival);
    walkDistance.push(footpath.distanceMeters);
    return index.connectionCount + walk;
  };
  const maximumWalkingMeters = options.maximumWalkingMeters ?? Number.POSITIVE_INFINITY;
  const relaxFootpaths = (from: number, arrival: number, previous: number, initialWalkingMeters: number, transitUsed: number) => {
    const queue = [{ from, arrival, previous, walkingMeters: initialWalkingMeters, transitUsed }];
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor];
      for (const footpath of footpathsFrom.get(current.from) ?? []) {
        const walkedArrival = current.arrival + footpath.durationSeconds;
        const walkedMeters = current.walkingMeters + footpath.distanceMeters;
        if (walkedMeters > maximumWalkingMeters) continue;
        if (walkedArrival > earliest[footpath.to] || (walkedArrival === earliest[footpath.to] && walkedMeters >= walkingAtStop[footpath.to])) continue;
        const reference = addWalk(current.previous, footpath, current.arrival, walkedArrival);
        earliest[footpath.to] = walkedArrival;
        walkingAtStop[footpath.to] = walkedMeters;
        transitUsedAtStop[footpath.to] = current.transitUsed;
        predecessor[footpath.to] = reference;
        queue.push({ from: footpath.to, arrival: walkedArrival, previous: reference, walkingMeters: walkedMeters, transitUsed: current.transitUsed });
      }
    }
  };
  for (const origin of origins) relaxFootpaths(origin, departAfter, -1, 0, 0);

  for (let connection = 0; connection < index.connectionCount; connection += 1) {
    const base = connection * index.recordBytes;
    const departure = index.data.readUInt32LE(base);
    if (departure < departAfter) continue;
    const arrival = index.data.readUInt32LE(base + 4);
    const from = index.data.readUInt32LE(base + 8);
    const to = index.data.readUInt32LE(base + 12);
    const trip = index.data.readUInt32LE(base + 16);
    if (activeTrips && activeTrips[trip] !== 1) continue;
    const canStayAboard = reachedTrip[trip] === 1;
    const transferBuffer = originSet.has(from) ? 0 : minimumTransferSeconds;
    const canBoard = earliest[from] !== 0xffffffff && earliest[from] + transferBuffer <= departure && (!options.directOnly || transitUsedAtStop[from] === 0);
    if (canBoard && !canStayAboard) {
      reachedTrip[trip] = 1;
      tripWalkingMeters[trip] = walkingAtStop[from];
    }
    if (canStayAboard || canBoard) pathPrevious[connection] = canStayAboard ? lastTripConnection[trip] : predecessor[from];
    const pathWalkingMeters = canStayAboard ? tripWalkingMeters[trip] : walkingAtStop[from];
    if ((canStayAboard || canBoard) && (arrival < earliest[to] || (arrival === earliest[to] && pathWalkingMeters < walkingAtStop[to]))) {
      earliest[to] = arrival;
      walkingAtStop[to] = pathWalkingMeters;
      transitUsedAtStop[to] = 1;
      predecessor[to] = connection;
      relaxFootpaths(to, arrival, connection, pathWalkingMeters, 1);
    }
    if (canStayAboard || canBoard) lastTripConnection[trip] = connection;
  }

  const destination = destinations.reduce((best, candidate) => earliest[candidate] < earliest[best] ? candidate : best, destinations[0]);
  if (predecessor[destination] < 0) return null;
  const reversed: ConnectionLeg[] = [];
  let reference = predecessor[destination];
  while (reference >= 0) {
    if (reference < index.connectionCount) {
      const from = index.data.readUInt32LE(field(reference, index.recordBytes, 2));
      reversed.push({
        departure: index.data.readUInt32LE(field(reference, index.recordBytes, 0)),
        arrival: index.data.readUInt32LE(field(reference, index.recordBytes, 1)),
        from,
        to: index.data.readUInt32LE(field(reference, index.recordBytes, 3)),
        trip: index.data.readUInt32LE(field(reference, index.recordBytes, 4)),
      });
      reference = pathPrevious[reference];
    } else {
      const walk = reference - index.connectionCount;
      reversed.push({ from: walkFrom[walk], to: walkTo[walk], departure: walkDeparture[walk], arrival: walkArrival[walk], trip: -1, distanceMeters: walkDistance[walk] });
      reference = walkPrevious[walk];
    }
  }
  const result = reversed.reverse();
  return result[0] && originSet.has(result[0].from) ? result : null;
}

export function parseServiceTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 47 || minutes > 59) return null;
  return hours * 3600 + minutes * 60;
}

export function formatServiceTime(value: number): string {
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
