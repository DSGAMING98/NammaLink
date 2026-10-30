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
    const response = await GET(request({ origin: "20568", destination: "metro:WHTM", date: "2026-10-30", departAfter: "08:00", priority: "safest", maxWalkingMeters: "400" }));
    const body = await response.json();
    expect(body.journey.modes).toEqual(["bus", "metro"]);
    expect(body.journey.walkingMeters).toBe(128);
    expect(body.journey.rides.some((ride: { mode: string; distanceMeters?: number }) => ride.mode === "walk" && ride.distanceMeters === 128)).toBe(true);
    expect(body.journey.contract).toMatchObject({ priority: "safest", maximumWalkingMeters: 400, minimumTransferSeconds: 180 });

    const tighterResponse = await GET(request({ origin: "20568", destination: "metro:WHTM", date: "2026-10-30", departAfter: "08:00", priority: "safest", maxWalkingMeters: "100" }));
    const tighterBody = await tighterResponse.json();
    expect(tighterBody.journey.walkingMeters).toBe(83);
    expect(tighterBody.journey.walkingMeters).toBeLessThanOrEqual(100);
  });

  it("enforces direct-only and validates city-scale contract controls", async () => {
    const direct = await GET(request({ origin: "metro:WHTM", destination: "metro:CLGA", date: "2026-10-30", departAfter: "08:00", priority: "direct", maxWalkingMeters: "0" }));
    const directBody = await direct.json();
    expect(directBody.journey).toMatchObject({ transfers: 0, walkingMeters: 0, contract: { priority: "direct", directOnly: true } });

    const invalid = await GET(request({ origin: "metro:WHTM", destination: "metro:CLGA", date: "2026-10-30", departAfter: "08:00", priority: "unknown", maxWalkingMeters: "-1" }));
    expect(invalid.status).toBe(400);
  });

  it("finds a latest departure that satisfies an arrive-by deadline", async () => {
    const response = await GET(request({ origin: "metro:WHTM", destination: "metro:CLGA", date: "2026-10-30", arriveBy: "09:30", priority: "safest", maxWalkingMeters: "0" }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.journey).toMatchObject({ departure: "08:00", arrival: "09:20", contract: { timeMode: "arriveBy", requestedTime: "09:30", latestStart: "08:00", deadlineMet: true } });
    expect(body.network.scanCount).toBeGreaterThan(1);
    expect(body.network.scanStrategy).toBe("minute-precision monotone deadline search");

    const bothModes = await GET(request({ origin: "metro:WHTM", destination: "metro:CLGA", date: "2026-10-30", departAfter: "08:00", arriveBy: "09:30" }));
    expect(bothModes.status).toBe(400);
  });

  it("rejects dates outside the shared feed window", async () => {
    const response = await GET(request({ origin: "metro:WHTM", destination: "metro:CLGA", date: "2027-09-01", departAfter: "08:00" }));
    expect(response.status).toBe(422);
  });
});
