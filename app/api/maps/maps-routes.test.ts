import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as autocomplete } from "./autocomplete/route";
import { GET as geocode } from "./geocode/route";
import { POST as walkingRoute } from "./walking-route/route";

describe("maps gateway", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rejects short autocomplete input with the stable error shape", async () => {
    const response = await autocomplete(new Request("https://nammalink.in/api/maps/autocomplete?input=x"));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(body.error.requestId).toBeTruthy();
  });

  it("fails closed when a server key is missing", async () => {
    vi.stubEnv("GOOGLE_GEOCODING_API_KEY", "");
    const response = await geocode(new Request("https://nammalink.in/api/maps/geocode?q=Majestic"));
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("CONFIGURATION_ERROR");
  });

  it("validates walking coordinates before calling Google", async () => {
    const response = await walkingRoute(new Request("https://nammalink.in/api/maps/walking-route", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ origin: { latitude: 190, longitude: 77.5 }, destination: { latitude: 13, longitude: 77.6 } }),
    }));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("BAD_REQUEST");
  });

  it("normalizes and caches successful geocoding responses", async () => {
    vi.stubEnv("GOOGLE_GEOCODING_API_KEY", "test-server-key");
    const provider = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "OK", results: [{ place_id: "place-1", formatted_address: "Majestic, Bengaluru", geometry: { location: { lat: 12.9767, lng: 77.5713 } } }] }), { status: 200 }));
    vi.stubGlobal("fetch", provider);
    const first = await geocode(new Request("https://nammalink.in/api/maps/geocode?q=Majestic%20Bengaluru"));
    const second = await geocode(new Request("https://nammalink.in/api/maps/geocode?q=Majestic%20Bengaluru"));
    expect(first.status).toBe(200);
    expect((await first.json()).results[0].location).toEqual({ latitude: 12.9767, longitude: 77.5713 });
    expect(second.status).toBe(200);
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("normalizes provider failures without exposing provider details", async () => {
    vi.stubEnv("GOOGLE_GEOCODING_API_KEY", "test-server-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { status: "PERMISSION_DENIED", message: "sensitive provider detail" } }), { status: 403 })));
    const response = await geocode(new Request("https://nammalink.in/api/maps/geocode?q=Failure%20Case"));
    const body = await response.json();
    expect(response.status).toBe(502);
    expect(body.error.code).toBe("UPSTREAM_ERROR");
    expect(body.error.message).not.toContain("sensitive");
  });
});
