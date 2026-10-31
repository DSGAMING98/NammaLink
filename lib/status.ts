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
    detail: "Published BMTC and BMRCL schedules power city-wide journey planning.",
  },
  {
    label: "Safest, fastest and direct routes",
    status: "verified-static",
    detail: "Compare arrival time, waiting, transfers and walking for every option.",
  },
  {
    label: "Airport Mode and saved journeys",
    status: "verified-static",
    detail: "Explore Vayu Vajra services and keep route details available on your device.",
  },
  {
    label: "Realtime vehicle positions",
    status: "blocked",
    detail: "Ready to connect when an official operator realtime feed is available.",
  },
];

export function statusLabel(status: DataSourceStatus): string {
  const labels: Record<DataSourceStatus, string> = {
    "verified-static": "Verified static data",
    planned: "In development",
    blocked: "Operator integration",
  };

  return labels[status];
}

