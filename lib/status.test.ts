import { describe, expect, it } from "vitest";
import { capabilityStatus, statusLabel } from "./status";

describe("project capability status", () => {
  it("uses explicit labels for every evidence state", () => {
    expect(statusLabel("verified-static")).toBe("Verified static data");
    expect(statusLabel("planned")).toBe("In development");
    expect(statusLabel("blocked")).toBe("Operator integration");
  });

  it("does not label blocked capabilities as verified", () => {
    const blocked = capabilityStatus.filter((item) => item.status === "blocked");
    expect(blocked.length).toBeGreaterThan(0);
    expect(blocked.every((item) => statusLabel(item.status) !== "Verified static data")).toBe(true);
  });
});

