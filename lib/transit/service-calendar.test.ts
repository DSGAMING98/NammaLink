import { describe, expect, it } from "vitest";
import { activeServicesForDate, activeTripsForDate } from "./service-calendar";

const services = [{
  validFrom: "2026-01-01",
  validUntil: "2026-12-31",
  weekdays: [true, true, true, true, true, false, false],
  exceptions: { "2026-10-31": 1, "2026-10-30": 2 },
}];

describe("GTFS service calendar", () => {
  it("applies weekdays, date bounds, additions, and removals", () => {
    expect([...activeServicesForDate(services, "2026-10-29")]).toEqual([1]);
    expect([...activeServicesForDate(services, "2026-10-30")]).toEqual([0]);
    expect([...activeServicesForDate(services, "2026-10-31")]).toEqual([1]);
    expect([...activeServicesForDate(services, "2027-10-29")]).toEqual([0]);
  });

  it("maps active services to trips and rejects malformed dates", () => {
    expect([...activeTripsForDate([{ service: 0 }, { service: -1 }], services, "2026-10-29")]).toEqual([1, 0]);
    expect([...activeServicesForDate(services, "not-a-date")]).toEqual([0]);
  });
});
