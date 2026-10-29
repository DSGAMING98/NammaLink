"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Journey, JourneyPreference, PlanResult } from "@/lib/transit/types";
import type { DisruptionIncident, RecoveryResult } from "@/lib/disruptions/types";
import { formatServiceTime } from "@/lib/transit/time";
import { LAST_JOURNEY_KEY, queueReport } from "@/lib/offline/storage";

interface JourneyResponse extends PlanResult {
  network: { name: string; version: string; validUntil: string; source: string };
}

interface RecoveryResponse {
  simulation: true;
  label: string;
  incident: DisruptionIncident;
  recovery: RecoveryResult;
}

const preferences: Array<{ value: JourneyPreference; label: string }> = [
  { value: "fastest", label: "Fastest" },
  { value: "least_waiting", label: "Least waiting" },
  { value: "least_walking", label: "Least walking" },
  { value: "direct_preferred", label: "Direct preferred" },
  { value: "direct_only", label: "Direct only" },
];

function JourneyCard({ journey, index, onSimulate, simulating }: { journey: Journey; index: number; onSimulate?: () => void; simulating?: boolean }) {
  return (
    <article className="resultCard">
      <div className="resultTopline">
        <div>
          <span className="resultRank">{index === 0 ? "Recommended" : `Alternative ${index}`}</span>
          <strong>{formatServiceTime(journey.departureSeconds)} → {formatServiceTime(journey.arrivalSeconds)}</strong>
        </div>
        <span className="sourceBadge">Scheduled</span>
      </div>
      <div className="routeChips" aria-label="Routes used">
        {journey.legs.map((leg, legIndex) => (
          <span key={`${leg.tripId}-${legIndex}`}>{leg.routeShortName}</span>
        ))}
      </div>
      <ol className="legList">
        {journey.legs.map((leg) => (
          <li key={`${leg.tripId}-${leg.boardStop.id}`}>
            <span>{formatServiceTime(leg.departureSeconds)}</span>
            <div><strong>{leg.boardStop.name}</strong><small>Board {leg.routeShortName} toward {leg.headsign}</small></div>
            <span>{formatServiceTime(leg.arrivalSeconds)}</span>
            <div><strong>{leg.alightStop.name}</strong><small>Alight</small></div>
          </li>
        ))}
      </ol>
      <div className="resultMetrics">
        <span><strong>{Math.round(journey.durationSeconds / 60)} min</strong> total</span>
        <span><strong>{Math.round(journey.waitingSeconds / 60)} min</strong> waiting</span>
        <span><strong>{Math.round(journey.walkingMeters)} m</strong> walking</span>
        <span><strong>{journey.transfers}</strong> transfer{journey.transfers === 1 ? "" : "s"}</span>
      </div>
      <p className="explanation">{journey.explanation}</p>
      {onSimulate && (
        <button className="simulateButton" type="button" onClick={onSimulate} disabled={simulating}>
          {simulating ? "Replanning…" : "Simulate a missed connection"}
        </button>
      )}
    </article>
  );
}

export function JourneyPlanner() {
  const [deadline, setDeadline] = useState("10:05");
  const [walking, setWalking] = useState(800);
  const [transfers, setTransfers] = useState(1);
  const [preference, setPreference] = useState<JourneyPreference>("fastest");
  const [result, setResult] = useState<JourneyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recovery, setRecovery] = useState<RecoveryResponse | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [savedJourney, setSavedJourney] = useState<JourneyResponse | null>(null);
  const [reportQueued, setReportQueued] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LAST_JOURNEY_KEY);
      if (stored) setSavedJourney(JSON.parse(stored));
    } catch {
      setSavedJourney(null);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setRecovery(null);

    try {
      const response = await fetch("/api/journeys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origin: { lat: 12.6418114, lon: 77.4404762 },
          destination: { lat: 12.7297587, lon: 77.7087603 },
          serviceDate: "2026-10-29",
          arriveBy: `${deadline}:00`,
          safetyBufferMinutes: 0,
          maxWalkingMeters: walking,
          maxTransfers: transfers,
          preference,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Journey search failed.");
      setResult(payload);
      setSavedJourney(payload);
      window.localStorage.setItem(LAST_JOURNEY_KEY, JSON.stringify(payload));
    } catch (reason) {
      setResult(null);
      setError(reason instanceof Error ? reason.message : "Journey search failed.");
    } finally {
      setLoading(false);
    }
  }

  function queueCurrentReport() {
    if (!recovery) return;
    queueReport(window.localStorage, {
      id: recovery.incident.id,
      type: "missed_connection",
      description: recovery.incident.title,
      createdAt: new Date().toISOString(),
    });
    setReportQueued(true);
  }

  async function simulateRecovery() {
    setSimulating(true);
    setError(null);
    try {
      const response = await fetch("/api/recovery", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Recovery simulation failed.");
      setRecovery(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Recovery simulation failed.");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="plannerWrap" id="journey">
      <form className="journeyPanel" onSubmit={submit}>
        <div className="panelHeader">
          <div><p className="smallLabel">Journey contract</p><h2>Campus commute</h2></div>
          <span className="sourceBadge">Scheduled</span>
        </div>

        <div className="routeLine" aria-label="Jain University to Alliance University">
          <span className="routeDot originDot" />
          <div><small>FROM</small><strong>Jain University</strong><span>Faculty of Engineering, Jakkasandra</span></div>
          <span className="routeStem" />
          <span className="routeDot destinationDot" />
          <div><small>TO</small><strong>Alliance University</strong><span>Central Campus, Anekal</span></div>
        </div>

        <div className="formGrid">
          <label>Arrive by<input type="time" value={deadline} onChange={(event) => setDeadline(event.target.value)} required /></label>
          <label>Max walk<input type="number" min="100" max="5000" step="50" value={walking} onChange={(event) => setWalking(Number(event.target.value))} /><small>metres</small></label>
          <label>Max transfers<select value={transfers} onChange={(event) => setTransfers(Number(event.target.value))}><option value={0}>0</option><option value={1}>1</option><option value={2}>2</option></select></label>
          <label>Priority<select value={preference} onChange={(event) => setPreference(event.target.value as JourneyPreference)}>{preferences.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        </div>

        <button className="searchButton" type="submit" disabled={loading}>{loading ? "Checking schedules…" : "Find verified options"}</button>
        {!result && savedJourney && <button className="restoreButton" type="button" onClick={() => setResult(savedJourney)}>Restore last saved journey</button>}
        <p className="panelNote">Static BMTC schedule version 20260907 · not live tracking</p>
      </form>

      <div className="resultsRegion" aria-live="polite" aria-busy={loading}>
        {error && <div className="messageCard errorCard"><strong>Search unavailable</strong><p>{error}</p></div>}
        {result?.journeys.length === 0 && <div className="messageCard"><strong>No feasible option</strong><p>{result.message}</p><small>Try a later deadline, more walking, or allow a transfer.</small></div>}
        {result?.journeys.map((journey, index) => (
          <JourneyCard
            journey={journey}
            index={index}
            key={`${journey.id}-${index}`}
            onSimulate={index === 0 ? simulateRecovery : undefined}
            simulating={simulating}
          />
        ))}
        {recovery && (
          <article className="recoveryCard">
            <div className="simulationLabel">Simulation · not a real disruption</div>
            <h3>Connection lost. Journey recovered.</h3>
            <p>{recovery.recovery.message}</p>
            <div className="recoveryEvidence">
              <span>Incident</span><strong>{recovery.incident.title}</strong>
              <span>Preserved</span><strong>{recovery.recovery.preservedLegs.length} completed leg</strong>
              <span>Original deadline</span><strong>{recovery.recovery.deadlineStillPossible ? "Still feasible" : "At risk"}</strong>
            </div>
            {recovery.recovery.continuation && (
              <div className="continuation">
                <small>Next feasible scheduled continuation</small>
                <strong>Replan {formatServiceTime(recovery.recovery.continuation.departureSeconds)} · arrive {formatServiceTime(recovery.recovery.continuation.arrivalSeconds)}</strong>
                <span>Board {recovery.recovery.continuation.legs[0].routeShortName} at {formatServiceTime(recovery.recovery.continuation.legs[0].departureSeconds)} · {Math.round(recovery.recovery.continuation.walkingMeters)} m walking</span>
              </div>
            )}
            <button className="queueButton" type="button" onClick={queueCurrentReport} disabled={reportQueued}>
              {reportQueued ? "Report queued on this device" : "Queue report for reconnection"}
            </button>
            <small className="queueNote">Local only. Nothing is uploaded by this prototype.</small>
          </article>
        )}
        {result && <p className="resultProvenance">{result.network.source} · feed {result.network.version} · {result.diagnostics.exploredBoardings} boardings evaluated</p>}
      </div>
    </div>
  );
}
