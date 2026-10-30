import { describe, expect, it } from "vitest";
import { earliestArrival, formatServiceTime, parseServiceTime } from "./connection-router";

function fixture(records: number[][]) {
  const data = Buffer.alloc(records.length * 20);
  records.forEach((record, row) => record.forEach((value, column) => data.writeUInt32LE(value, row * 20 + column * 4)));
  return { data, recordBytes: 20, connectionCount: records.length, stopCount: 4 };
}

describe("connection scan", () => {
  it("finds an earliest transfer path", () => {
    const result = earliestArrival(fixture([[100, 120, 0, 1, 0], [125, 150, 1, 2, 1], [105, 180, 0, 2, 2]]), 0, 2, 90);
    expect(result?.map((leg) => leg.trip)).toEqual([0, 1]);
    expect(result?.at(-1)?.arrival).toBe(150);
  });

  it("rejects missed connections and invalid times", () => {
    expect(earliestArrival(fixture([[100, 120, 0, 1, 0], [119, 140, 1, 2, 1]]), 0, 2, 90)).toBeNull();
    expect(parseServiceTime("09:35")).toBe(34500);
    expect(parseServiceTime("09:99")).toBeNull();
    expect(formatServiceTime(34500)).toBe("09:35");
  });

  it("enforces transfer time while allowing a passenger to stay aboard", () => {
    const index = fixture([[100, 120, 0, 1, 0], [121, 140, 1, 2, 1], [122, 150, 1, 2, 0]]);
    expect(earliestArrival(index, 0, 2, 90, 5)?.map((leg) => leg.trip)).toEqual([0, 0]);
  });

  it("supports station endpoints with multiple platforms and calendar-filtered trips", () => {
    const index = { ...fixture([[100, 120, 1, 2, 0], [105, 125, 0, 2, 1]]), tripCount: 2 };
    expect(earliestArrival(index, [0, 1], [2, 3], 90, 0, new Uint8Array([1, 0]))?.map((leg) => leg.trip)).toEqual([0]);
    expect(earliestArrival(index, [0, 1], [2, 3], 90, 0, new Uint8Array([0, 0]))).toBeNull();
  });

  it("reconstructs an explicit walking transfer between scheduled services", () => {
    const index = {
      ...fixture([[100, 120, 0, 1, 0], [300, 320, 2, 3, 1]]),
      tripCount: 2,
      footpaths: [{ from: 1, to: 2, distanceMeters: 125, durationSeconds: 100 }],
    };
    const result = earliestArrival(index, 0, 3, 90, 10);
    expect(result?.map((leg) => leg.trip)).toEqual([0, -1, 1]);
    expect(result?.[1]).toMatchObject({ from: 1, to: 2, distanceMeters: 125, departure: 120, arrival: 220 });
  });

  it("enforces the walking budget and direct-only contract", () => {
    const index = {
      ...fixture([[100, 120, 0, 1, 0], [230, 250, 2, 3, 1], [300, 360, 0, 3, 2]]),
      tripCount: 3,
      footpaths: [{ from: 1, to: 2, distanceMeters: 125, durationSeconds: 100 }],
    };
    expect(earliestArrival(index, 0, 3, 90, 0, undefined, { maximumWalkingMeters: 100 })?.map((leg) => leg.trip)).toEqual([2]);
    expect(earliestArrival(index, 0, 3, 90, 0, undefined, { maximumWalkingMeters: 125 })?.map((leg) => leg.trip)).toEqual([0, -1, 1]);
    expect(earliestArrival(index, 0, 3, 90, 0, undefined, { directOnly: true })?.map((leg) => leg.trip)).toEqual([2]);
  });
});
