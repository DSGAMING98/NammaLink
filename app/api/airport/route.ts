import { z } from "zod";
import { queryAirportServices } from "@/lib/airport/service";

export const runtime = "nodejs";

const schema = z.object({
  mode: z.enum(["to_airport", "from_airport"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  after: z.string().regex(/^([01]?\d|2[0-9]):[0-5]\d$/),
  lat: z.coerce.number().min(12.5).max(13.5).optional(),
  lon: z.coerce.number().min(77.1).max(78.1).optional(),
  q: z.string().trim().max(120).optional(),
}).refine((value) => (value.lat === undefined) === (value.lon === undefined), { message: "lat and lon must be provided together" });

export function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = schema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return Response.json({ error: "Provide mode, date, after and optional Bengaluru lat/lon or corridor query." }, { status: 400 });
  const result = queryAirportServices({ mode: parsed.data.mode, date: parsed.data.date, after: parsed.data.after, latitude: parsed.data.lat, longitude: parsed.data.lon, query: parsed.data.q });
  return Response.json({ ...result, count: result.routes.length, airport: { name: "Kempegowda International Airport Bengaluru", code: "BLR", terminalContext: "Vayu Vajra services use the airport BMTC bus stops; confirm the current terminal stop in the official operator app before travel." } });
}
