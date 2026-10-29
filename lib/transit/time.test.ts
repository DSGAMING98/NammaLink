import { describe, expect, it } from "vitest";
import { formatServiceTime, parseGtfsTime } from "./time";

describe("GTFS service time", () => {
  it("supports services after midnight using hours above 24", () => {
    expect(parseGtfsTime("25:15:30")).toBe(90_930);
    expect(formatServiceTime(90_930)).toBe("25:15");
  });

  it("rejects invalid minute values", () => {
    expect(() => parseGtfsTime("12:60:00")).toThrow("Invalid GTFS time");
  });
});
