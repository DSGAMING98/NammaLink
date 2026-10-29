const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export function parseGtfsTime(value: string): number {
  const match = /^(\d{1,3}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid GTFS time: ${value}`);
  const [, hours, minutes, seconds] = match.map(Number);
  if (minutes > 59 || seconds > 59) throw new Error(`Invalid GTFS time: ${value}`);
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatServiceTime(totalSeconds: number): string {
  const rounded = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function compactDate(isoDate: string): string {
  return isoDate.replaceAll("-", "");
}

export function serviceDayName(isoDate: string): (typeof dayNames)[number] {
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.valueOf())) throw new Error(`Invalid service date: ${isoDate}`);
  return dayNames[date.getUTCDay()];
}
