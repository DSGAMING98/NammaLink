import { describe, expect, it } from "vitest";
import { searchStops } from "./stop-search";

const stops = [
  { id: "1", name: "Banashankari TTMC", lat: 12.92, lon: 77.57 },
  { id: "2", name: "Banashankari 2nd Stage", lat: 12.93, lon: 77.56 },
  { id: "3", name: "Kempegowda Bus Station", lat: 12.97, lon: 77.57 },
];

describe("searchStops", () => {
  it("requires a meaningful query and ranks prefix matches", () => {
    expect(searchStops(stops, "b")).toEqual([]);
    expect(searchStops(stops, "banashankari").map((stop) => stop.id)).toEqual(["2", "1"]);
  });

  it("supports order-independent token matching and limits results", () => {
    expect(searchStops(stops, "station kempegowda", 1)).toEqual([stops[2]]);
  });
});
