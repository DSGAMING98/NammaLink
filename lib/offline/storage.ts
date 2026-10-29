export const LAST_JOURNEY_KEY = "nammalink:last-journey:v1";
export const REPORT_QUEUE_KEY = "nammalink:report-queue:v1";

export interface QueuedReport {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  status: "queued";
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function readQueuedReports(storage: StorageLike): QueuedReport[] {
  const raw = storage.getItem(REPORT_QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((report): report is QueuedReport =>
      typeof report === "object" && report !== null &&
      typeof report.id === "string" && report.status === "queued",
    );
  } catch {
    return [];
  }
}

export function queueReport(storage: StorageLike, report: Omit<QueuedReport, "status">): QueuedReport[] {
  const queue = readQueuedReports(storage);
  const nextReport: QueuedReport = { ...report, status: "queued" };
  const updated = [...queue.filter((item) => item.id !== report.id), nextReport].slice(-20);
  storage.setItem(REPORT_QUEUE_KEY, JSON.stringify(updated));
  return updated;
}
