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
});
