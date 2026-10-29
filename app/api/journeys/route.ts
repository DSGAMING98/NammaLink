import { NextResponse } from "next/server";
import { z } from "zod";
import demoNetwork from "@/data/demo-network.json";
import { planJourneys } from "@/lib/transit/router";
import type { TransitNetwork } from "@/lib/transit/types";

export const journeyRequestSchema = z.object({
  origin: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }),
  destination: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  arriveBy: z.string().regex(/^\d{1,3}:\d{2}:\d{2}$/),
  safetyBufferMinutes: z.number().int().min(0).max(60).default(0),
  maxWalkingMeters: z.number().int().min(0).max(5_000),
  maxTransfers: z.number().int().min(0).max(3),
  preference: z.enum(["fastest", "least_waiting", "least_walking", "direct_preferred", "direct_only"]),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = journeyRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid journey request.", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = planJourneys(demoNetwork as TransitNetwork, {
    ...parsed.data,
    searchHorizonMinutes: 300,
  });

  return NextResponse.json({
    ...result,
    network: {
      name: demoNetwork.metadata.name,
      version: demoNetwork.metadata.version,
      validUntil: demoNetwork.metadata.validUntil,
      source: "Static BMTC community GTFS",
    },
  });
}
