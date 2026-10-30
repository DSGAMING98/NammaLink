import { describe, expect, it } from "vitest";
import { GET } from "./route";

const request = (params: Record<string, string>) => new Request(`http://localhost/api/network-journeys?${new URLSearchParams(params)}`);

describe("multimodal network journey API", () => {
  it("returns a calendar-filtered Metro journey with provenance", async () => {
    const response = await GET(request({ origin: "metro:WHTM", destination: "metro:CLGA", date: "2026-10-30", departAfter: "08:00" }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.journey).toMatchObject({ departure: "08:00", arrival: "09:20", modes: ["metro"] });
    expect(body.journey.rides[0]).toMatchObject({ agency: "BMRCL", mode: "metro", route: "Purple" });
    expect(body.network.activeTrips).toBeLessThan(body.network.trips);
    expect(body.network.feedVersions).toMatchObject({ BMTC: "20260907", BMRCL: "20260817" });
  });

  it("returns explicit walking in a bus-to-Metro journey", async () => {
    const response = await GET(request({ origin: "20568", destination: "metro:WHTM", date: "2026-10-30", departAfter: "08:00" }));
    const body = await response.json();
    expect(body.journey.modes).toEqual(["bus", "metro"]);
    expect(body.journey.walkingMeters).toBe(128);
    expect(body.journey.rides.some((ride: { mode: string; distanceMeters?: number }) => ride.mode === "walk" && ride.distanceMeters === 128)).toBe(true);
  });

  it("rejects dates outside the shared feed window", async () => {
    const response = await GET(request({ origin: "metro:WHTM", destination: "metro:CLGA", date: "2027-09-01", departAfter: "08:00" }));
    expect(response.status).toBe(422);
  });
});
