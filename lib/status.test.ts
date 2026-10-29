import { describe, expect, it } from "vitest";
import { capabilityStatus, statusLabel } from "./status";

describe("project capability status", () => {
  it("uses explicit labels for every evidence state", () => {
    expect(statusLabel("verified-static")).toBe("Verified static data");
    expect(statusLabel("planned")).toBe("In development");
    expect(statusLabel("blocked")).toBe("External data needed");
  });

  it("does not label planned capabilities as verified", () => {
    const planned = capabilityStatus.filter((item) => item.status === "planned");
    expect(planned.length).toBeGreaterThan(0);
    expect(planned.every((item) => statusLabel(item.status) !== "Verified static data")).toBe(true);
  });
});

