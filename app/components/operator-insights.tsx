import demoNetwork from "@/data/demo-network.json";
import { analyzeSchedule } from "@/lib/insights/schedule";
import { formatServiceTime } from "@/lib/transit/time";
import type { TransitNetwork } from "@/lib/transit/types";
import fullNetwork from "@/data/transit-connections.meta.json";
import { analyzeFullNetworkSupply } from "@/lib/insights/full-network";

export function OperatorInsights() {
  const insights = analyzeSchedule(demoNetwork as TransitNetwork);
  const fullSupply = analyzeFullNetworkSupply(fullNetwork.trips);
  const topRoutes = fullSupply.routes.slice(0, 8);

  return (
    <section className="insightsSection" id="insights">
      <div className="sectionHeading">
        <p className="eyebrow">Transit operations insights</p>
        <h2>Schedule evidence, without fake utilization claims.</h2>
        <p>This bounded view shows planned service supply. It does not measure passenger load, vehicle occupancy, dispatch adherence, or actual fleet efficiency.</p>
      </div>
      <div className="insightTotals">
        <div><strong>{insights.totalTrips}</strong><span>scheduled trips</span></div>
        <div><strong>{insights.totalStops}</strong><span>referenced stops</span></div>
        <div><strong>{insights.routes.length}</strong><span>selected routes</span></div>
      </div>
      <div className="routeTable" role="table" aria-label="Schedule frequency by selected route">
        <div className="routeTableHeader" role="row"><span>Route</span><span>Trips</span><span>Service span</span><span>Median headway</span></div>
        {insights.routes.map((route) => (
          <div role="row" key={route.routeId}>
            <strong>{route.shortName}</strong>
            <span>{route.trips}</span>
            <span>{formatServiceTime(route.firstDepartureSeconds)}–{formatServiceTime(route.lastDepartureSeconds)}</span>
            <span>{route.medianHeadwayMinutes === null ? "Not enough trips" : `${Math.round(route.medianHeadwayMinutes)} min`}</span>
          </div>
        ))}
      </div>
      <p className="insightNote">Bounded BMTC fixture · static schedule version 20260907 · direction-aware median headways</p>
      <div className="fullSupplyHeading">
        <p className="eyebrow">Full-feed scheduled supply</p>
        <h3>City-scale bus and Metro coverage.</h3>
        <p>This expands coverage to the full community feed. Bar length represents trip count only—not ridership, reliability, occupancy, or revenue.</p>
      </div>
      <div className="insightTotals fullTotals">
        <div><strong>{fullNetwork.searchableStopCount.toLocaleString("en-IN")}</strong><span>searchable stops</span></div>
        <div><strong>{fullSupply.totalTrips.toLocaleString("en-IN")}</strong><span>scheduled trips</span></div>
        <div><strong>{fullSupply.totalRoutes.toLocaleString("en-IN")}</strong><span>route records</span></div>
        <div><strong>{fullNetwork.connectionCount.toLocaleString("en-IN")}</strong><span>admitted connections</span></div>
      </div>
      <div className="supplyBars" aria-label="Top full-feed routes by scheduled trip count">
        {topRoutes.map((route) => (
          <div className="supplyRow" key={route.routeId}>
            <div><strong>{route.route}</strong><span>{route.trips.toLocaleString("en-IN")} trips</span></div>
            <div className="supplyTrack"><span style={{ width: `${(route.trips / fullSupply.maximumTrips) * 100}%` }} /></div>
          </div>
        ))}
      </div>
      <p className="insightNote">BMTC {fullNetwork.feedVersions.BMTC} + BMRCL {fullNetwork.feedVersions.BMRCL} community GTFS · {fullNetwork.plausibilityGate.rejectedConnections.toLocaleString("en-IN")} implausible connections excluded · zero trained ML models</p>
    </section>
  );
}
