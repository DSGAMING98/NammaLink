export type DataSourceStatus = "verified-static" | "planned" | "blocked";

export interface CapabilityStatus {
  label: string;
  status: DataSourceStatus;
  detail: string;
}

export const capabilityStatus: CapabilityStatus[] = [
  {
    label: "BMTC + Namma Metro schedules",
    status: "verified-static",
    detail: "Local community GTFS snapshots are available for schedule-based routing.",
  },
  {
    label: "Constraint-aware route search",
    status: "planned",
    detail: "Transit engine implementation is the next milestone.",
  },
  {
    label: "Live vehicle and disruption feeds",
    status: "blocked",
    detail: "No authorized realtime feed has been verified.",
  },
];

export function statusLabel(status: DataSourceStatus): string {
  const labels: Record<DataSourceStatus, string> = {
    "verified-static": "Verified static data",
    planned: "In development",
    blocked: "External data needed",
  };

  return labels[status];
}

