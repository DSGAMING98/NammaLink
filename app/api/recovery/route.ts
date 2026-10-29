import { NextResponse } from "next/server";
import demoNetwork from "@/data/demo-network.json";
import { recoverJourney } from "@/lib/disruptions/engine";
import type { DisruptionIncident } from "@/lib/disruptions/types";
import { planJourneys } from "@/lib/transit/router";
import type { TransitNetwork } from "@/lib/transit/types";

const network = demoNetwork as TransitNetwork;
const destination = { lat: 12.7297587, lon: 77.7087603 };

export async function POST() {
  const activeJourney = planJourneys(network, {
    origin: { lat: 12.6418114, lon: 77.4404762 },
    destination,
    serviceDate: "2026-10-29",
    arriveBy: "10:05:00",
    maxWalkingMeters: 800,
    maxTransfers: 1,
    preference: "fastest",
    searchHorizonMinutes: 240,
  }).journeys[0];

  if (!activeJourney?.legs[1]) {
    return NextResponse.json({ error: "The demonstration journey is unavailable." }, { status: 503 });
  }

  const incident: DisruptionIncident = {
    id: "simulation-second-bus-unavailable",
    title: `${activeJourney.legs[1].routeShortName} connection unavailable`,
    state: "verified",
    simulated: true,
    reportedAt: "2026-10-29T08:00:00+05:30",
    expiresAt: "2026-10-29T11:00:00+05:30",
    affectedTripIds: [activeJourney.legs[1].tripId],
    affectedRouteIds: [],
    affectedStopIds: [],
  };

  const recovery = recoverJourney(network, {
    activeJourney,
    completedLegCount: 1,
    currentLocation: { lat: 12.917407, lon: 77.57278 },
    currentTime: "08:00:00",
    destination,
    serviceDate: "2026-10-29",
    contract: {
      arrivalDeadline: "10:05:00",
      maxWalkingMeters: 800,
      maxTransfers: 1,
      preference: "fastest",
    },
    incidents: [incident],
  });

  return NextResponse.json({
    simulation: true,
    label: "Simulated incident — treated as verified only inside this demonstration",
    incident,
    recovery,
  });
}
