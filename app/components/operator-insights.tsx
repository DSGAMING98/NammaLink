import demoNetwork from "@/data/demo-network.json";
import { analyzeSchedule } from "@/lib/insights/schedule";
import { formatServiceTime } from "@/lib/transit/time";
import type { TransitNetwork } from "@/lib/transit/types";

export function OperatorInsights() {
  const insights = analyzeSchedule(demoNetwork as TransitNetwork);

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
    </section>
  );
}
