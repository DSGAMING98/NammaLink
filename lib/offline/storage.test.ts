import { describe, expect, it } from "vitest";
import { queueReport, readQueuedReports, REPORT_QUEUE_KEY } from "./storage";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(REPORT_QUEUE_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("offline report queue", () => {
  it("recovers safely from invalid local data", () => {
    expect(readQueuedReports(memoryStorage("not-json"))).toEqual([]);
  });

  it("deduplicates reports and keeps them explicitly queued", () => {
    const storage = memoryStorage();
    const report = { id: "r1", type: "missed_connection", description: "Demo report", createdAt: "2026-10-29T08:00:00Z" };
    queueReport(storage, report);
    const result = queueReport(storage, { ...report, description: "Updated" });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "r1", description: "Updated", status: "queued" });
  });
});
