import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("recovery demonstration API", () => {
  it("labels the incident as simulated and returns a deadline-risk continuation", async () => {
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.simulation).toBe(true);
    expect(body.incident.simulated).toBe(true);
    expect(body.recovery.status).toBe("deadline_at_risk");
    expect(body.recovery.preservedLegs).toHaveLength(1);
    expect(body.recovery.continuation).not.toBeNull();
  });
});
