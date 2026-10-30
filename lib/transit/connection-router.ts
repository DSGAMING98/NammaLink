export type ConnectionIndex = {
  data: Buffer;
  recordBytes: number;
  connectionCount: number;
  stopCount: number;
};

export type ConnectionLeg = { from: number; to: number; departure: number; arrival: number; trip: number };

const field = (index: number, recordBytes: number, fieldIndex: number) => index * recordBytes + fieldIndex * 4;

export function earliestArrival(index: ConnectionIndex, origin: number, destination: number, departAfter: number, minimumTransferSeconds = 0): ConnectionLeg[] | null {
  if (origin < 0 || destination < 0 || origin >= index.stopCount || destination >= index.stopCount) return null;
  if (origin === destination) return [];
  const earliest = new Uint32Array(index.stopCount);
  earliest.fill(0xffffffff);
  earliest[origin] = departAfter;
  const predecessor = new Int32Array(index.stopCount);
  predecessor.fill(-1);
  const reachedTrip = new Uint8Array(index.connectionCount);
  const lastTripConnection = new Int32Array(index.connectionCount);
  lastTripConnection.fill(-1);
  const pathPrevious = new Int32Array(index.connectionCount);
  pathPrevious.fill(-1);

  for (let connection = 0; connection < index.connectionCount; connection += 1) {
    const base = connection * index.recordBytes;
    const departure = index.data.readUInt32LE(base);
    if (departure < departAfter) continue;
    const arrival = index.data.readUInt32LE(base + 4);
    const from = index.data.readUInt32LE(base + 8);
    const to = index.data.readUInt32LE(base + 12);
    const trip = index.data.readUInt32LE(base + 16);
    const canStayAboard = reachedTrip[trip] === 1;
    const transferBuffer = from === origin ? 0 : minimumTransferSeconds;
    const canBoard = earliest[from] !== 0xffffffff && earliest[from] + transferBuffer <= departure;
    if (canBoard && !canStayAboard) reachedTrip[trip] = 1;
    if (canStayAboard || canBoard) pathPrevious[connection] = canStayAboard ? lastTripConnection[trip] : predecessor[from];
    if ((canStayAboard || canBoard) && arrival < earliest[to]) {
      earliest[to] = arrival;
      predecessor[to] = connection;
    }
    if (canStayAboard || canBoard) lastTripConnection[trip] = connection;
  }

  if (predecessor[destination] < 0) return null;
  const reversed: ConnectionLeg[] = [];
  let connection = predecessor[destination];
  while (connection >= 0) {
    const from = index.data.readUInt32LE(field(connection, index.recordBytes, 2));
    reversed.push({
      departure: index.data.readUInt32LE(field(connection, index.recordBytes, 0)),
      arrival: index.data.readUInt32LE(field(connection, index.recordBytes, 1)),
      from,
      to: index.data.readUInt32LE(field(connection, index.recordBytes, 3)),
      trip: index.data.readUInt32LE(field(connection, index.recordBytes, 4)),
    });
    connection = pathPrevious[connection];
  }
  const result = reversed.reverse();
  return result[0]?.from === origin ? result : null;
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
