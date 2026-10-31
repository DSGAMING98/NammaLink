"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { TransitMap, type MapPoint } from "./transit-map";

type Language = "en" | "kn";
type Stop = { id: string; name: string; lat: number; lon: number; agency: string; mode: string; distanceMeters?: number };
type PlaceChoice = { placeId?: string; text: string; mainText?: string; secondaryText?: string; location?: { latitude: number; longitude: number }; stop?: Stop };
type AirportRoute = {
  id: string; route: string; longName: string; direction: string; proximityMeters: number | null;
  origin: Stop; destination: Stop; stops: Array<Stop & { arrival: string; departure: string }>;
  upcoming: Array<{ departure: string; waitMinutes: number }>;
  fareRange: { minimum: number; maximum: number; currency: string; source: string } | null;
  sourceStatus: "scheduled_static";
};
type Journey = {
  origin: Stop; destination: Stop; departure: string; arrival: string; durationSeconds: number; walkingMeters: number; transfers: number;
  rides: Array<{ route: string; mode: string; headsign: string; departure: string; arrival: string; from: Stop; to: Stop; distanceMeters?: number }>;
  recommendation: { title: string; reasons: string[] };
};

const copy = {
  en: { title: "Plan the whole Bengaluru journey", city: "City journey", airport: "Airport Mode", saved: "Saved & low-data", from: "Origin", to: "Destination", search: "Search places or stops", locate: "Use current location", plan: "Plan journey", scheduled: "Scheduled, not live", toAirport: "To airport", fromAirport: "From airport", findAirport: "Find airport buses", save: "Save offline", savedNow: "Saved on this device", map: "Map", satellite: "Satellite", ticket: "Open official Namma BMTC", retry: "Retry", noResult: "No supported option found. Try another place, time, or corridor.", historical: "2025 fare PDF is historical; it is not shown as a current fare." },
  kn: { title: "ಸಂಪೂರ್ಣ ಬೆಂಗಳೂರು ಪ್ರಯಾಣವನ್ನು ಯೋಜಿಸಿ", city: "ನಗರ ಪ್ರಯಾಣ", airport: "ವಿಮಾನ ನಿಲ್ದಾಣ ಮೋಡ್", saved: "ಉಳಿಸಿದ ಮತ್ತು ಕಡಿಮೆ ಡೇಟಾ", from: "ಹೊರಡುವ ಸ್ಥಳ", to: "ತಲುಪುವ ಸ್ಥಳ", search: "ಸ್ಥಳ ಅಥವಾ ನಿಲ್ದಾಣ ಹುಡುಕಿ", locate: "ಪ್ರಸ್ತುತ ಸ್ಥಳ ಬಳಸಿ", plan: "ಪ್ರಯಾಣ ಯೋಜಿಸಿ", scheduled: "ವೇಳಾಪಟ್ಟಿ ಮಾತ್ರ, ಲೈವ್ ಅಲ್ಲ", toAirport: "ವಿಮಾನ ನಿಲ್ದಾಣಕ್ಕೆ", fromAirport: "ವಿಮಾನ ನಿಲ್ದಾಣದಿಂದ", findAirport: "ವಿಮಾನ ನಿಲ್ದಾಣ ಬಸ್ ಹುಡುಕಿ", save: "ಆಫ್‌ಲೈನ್‌ಗೆ ಉಳಿಸಿ", savedNow: "ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ", map: "ನಕ್ಷೆ", satellite: "ಉಪಗ್ರಹ", ticket: "ಅಧಿಕೃತ ನಮ್ಮ BMTC ತೆರೆಯಿರಿ", retry: "ಮರುಪ್ರಯತ್ನಿಸಿ", noResult: "ಬೆಂಬಲಿತ ಆಯ್ಕೆ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಸ್ಥಳ, ಸಮಯ ಅಥವಾ ಮಾರ್ಗವನ್ನು ಪ್ರಯತ್ನಿಸಿ.", historical: "2025ರ ದರ PDF ಐತಿಹಾಸಿಕವಾಗಿದೆ; ಅದನ್ನು ಪ್ರಸ್ತುತ ದರವಾಗಿ ತೋರಿಸಲಾಗುವುದಿಲ್ಲ." },
};

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const nowTime = () => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());

async function responseJson(response: Response) {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? body.error ?? "Request failed");
  return body;
}

export function MobilityExperience() {
  const [language, setLanguage] = useState<Language>("en");
  const [tab, setTab] = useState<"city" | "airport" | "saved">("city");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(nowTime);
  const [satellite, setSatellite] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const t = copy[language];

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("nammalink:language");
    if (storedLanguage === "kn") setLanguage("kn");
    setLastSync(window.localStorage.getItem("nammalink:last-sync"));
  }, []);

  function changeLanguage(next: Language) {
    setLanguage(next);
    window.localStorage.setItem("nammalink:language", next);
  }

  function saveSnapshot(kind: string, value: unknown) {
    const savedAt = new Date().toISOString();
    window.localStorage.setItem(`nammalink:saved:${kind}`, JSON.stringify({ savedAt, value }));
    window.localStorage.setItem("nammalink:last-sync", savedAt);
    setLastSync(savedAt);
    setSavedMessage(t.savedNow);
  }

  return (
    <section className="mobilityExperience" id="mobility" aria-labelledby="mobility-title">
      <div className="mobilityHeading">
        <div><p className="eyebrow">Bengaluru mobility</p><h2 id="mobility-title">{t.title}</h2></div>
        <div className="languageSwitch" aria-label="Language"><button className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>English</button><button className={language === "kn" ? "active" : ""} onClick={() => changeLanguage("kn")}>ಕನ್ನಡ</button></div>
      </div>
      <div className="modeTabs" role="tablist">
        <button role="tab" aria-selected={tab === "city"} onClick={() => setTab("city")}>{t.city}</button>
        <button role="tab" aria-selected={tab === "airport"} onClick={() => setTab("airport")}>{t.airport}</button>
        <button role="tab" aria-selected={tab === "saved"} onClick={() => setTab("saved")}>{t.saved}</button>
      </div>
      {tab === "city" && <CityPlanner t={t} date={date} time={time} setDate={setDate} setTime={setTime} satellite={satellite} setSatellite={setSatellite} onSave={(value: unknown) => saveSnapshot("city", value)} savedMessage={savedMessage} />}
      {tab === "airport" && <AirportPlanner t={t} date={date} time={time} setDate={setDate} setTime={setTime} satellite={satellite} setSatellite={setSatellite} onSave={(value: unknown) => saveSnapshot("airport", value)} savedMessage={savedMessage} />}
      {tab === "saved" && <OfflinePanel t={t} lastSync={lastSync} />}
    </section>
  );
}

function PlaceField({ label, placeholder, value, onChange, onSelect, onLocation }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; onSelect: (choice: PlaceChoice) => void; onLocation?: () => void }) {
  const [choices, setChoices] = useState<PlaceChoice[]>([]);
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (value.trim().length < 2) { setChoices([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const google = await responseJson(await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(value)}`, { signal: controller.signal }));
        setChoices(google.suggestions);
        setStatus("Google Places");
      } catch {
        try {
          const fallback = await responseJson(await fetch(`/api/stops?q=${encodeURIComponent(value)}&limit=6`, { signal: controller.signal }));
          setChoices(fallback.stops.map((stop: Stop) => ({ text: stop.name, mainText: stop.name, secondaryText: `${stop.agency} ${stop.mode} stop`, stop })));
          setStatus("Verified stop fallback");
        } catch { setChoices([]); setStatus("Search unavailable"); }
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value]);
  return <div className="placeField"><label>{label}<input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>{onLocation && <button type="button" className="miniButton" onClick={onLocation}>⌖</button>}{choices.length > 0 && <div className="suggestionMenu"><small>{status}</small>{choices.map((choice) => <button type="button" key={choice.placeId ?? choice.stop?.id ?? choice.text} onClick={() => { onSelect(choice); setChoices([]); }}><strong>{choice.mainText ?? choice.text}</strong><span>{choice.secondaryText}</span></button>)}</div>}</div>;
}

function CityPlanner({ t, date, time, setDate, setTime, satellite, setSatellite, onSave, savedMessage }: any) {
  const [fromText, setFromText] = useState(""); const [toText, setToText] = useState("");
  const [from, setFrom] = useState<Stop | null>(null); const [to, setTo] = useState<Stop | null>(null);
  const [fromLocation, setFromLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  async function resolveChoice(choice: PlaceChoice, setter: (stop: Stop) => void, setLocation?: (location: { latitude: number; longitude: number }) => void) {
    if (choice.stop) { setter(choice.stop); return; }
    const place = await responseJson(await fetch(`/api/maps/place?placeId=${encodeURIComponent(choice.placeId ?? "")}`));
    if (!place.place) throw new Error("Place coordinates unavailable");
    const location = place.place.location;
    const nearby = await responseJson(await fetch(`/api/stops?lat=${location.latitude}&lon=${location.longitude}&radiusMeters=100000&limit=8`));
    if (!nearby.stops[0]) throw new Error("No supported bus or Metro stop found");
    setter(nearby.stops[0]); setLocation?.(location);
  }

  function locate() {
    navigator.geolocation?.getCurrentPosition(async (position) => {
      const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setFromLocation(location); setFromText("Current location");
      try { const nearby = await responseJson(await fetch(`/api/stops?lat=${location.latitude}&lon=${location.longitude}&radiusMeters=100000&limit=8`)); setFrom(nearby.stops[0] ?? null); } catch (reason) { setError(reason instanceof Error ? reason.message : "Location unavailable"); }
    }, () => setError("Location permission was denied. Search manually instead."), { enableHighAccuracy: true, timeout: 8000 });
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!from || !to) { setError("Select both places from the suggestions."); return; }
    setLoading(true); setError("");
    const params = new URLSearchParams({ origin: from.id, destination: to.id, date, departAfter: time, priority: "fastest", maxWalkingMeters: "100000" });
    if (fromLocation) { params.set("accessLat", String(fromLocation.latitude)); params.set("accessLon", String(fromLocation.longitude)); }
    try { const body = await responseJson(await fetch(`/api/network-journeys?${params}`)); if (!body.journey) throw new Error(body.evidence || t.noResult); setJourney(body.journey); window.localStorage.setItem("nammalink:last-sync", new Date().toISOString()); } catch (reason) { setJourney(null); setError(reason instanceof Error ? reason.message : t.noResult); } finally { setLoading(false); }
  }

  const points: MapPoint[] = journey ? journey.rides.flatMap((ride, index) => index === 0 ? [{ lat: ride.from.lat, lon: ride.from.lon, name: ride.from.name, role: "origin" as const }, { lat: ride.to.lat, lon: ride.to.lon, name: ride.to.name, role: ride === journey.rides.at(-1) ? "destination" as const : "transfer" as const }] : [{ lat: ride.to.lat, lon: ride.to.lon, name: ride.to.name, role: ride === journey.rides.at(-1) ? "destination" as const : "transfer" as const }]) : [];
  return <div className="featureGrid"><form className="featurePanel" onSubmit={submit}><div className="sourceRow"><span>{t.scheduled}</span><small>BMTC 20260907 + BMRCL 20260817</small></div><PlaceField label={t.from} placeholder={t.search} value={fromText} onChange={(value) => { setFromText(value); setFrom(null); setFromLocation(null); }} onLocation={locate} onSelect={async (choice) => { setFromText(choice.text); try { await resolveChoice(choice, setFrom, setFromLocation); } catch (reason) { setError(reason instanceof Error ? reason.message : t.noResult); } }} /><PlaceField label={t.to} placeholder={t.search} value={toText} onChange={(value) => { setToText(value); setTo(null); }} onSelect={async (choice) => { setToText(choice.text); try { await resolveChoice(choice, setTo); } catch (reason) { setError(reason instanceof Error ? reason.message : t.noResult); } }} /><div className="dateRow"><label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Depart after<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div><p className="guidanceNote">NammaLink connects your selected place to nearby supported stops and includes the access distance.</p><button className="searchButton" disabled={loading}>{loading ? "Planning…" : t.plan}</button>{error && <p className="inlineError">{error}</p>}</form><div className="featureResults">{journey ? <><div className="mapToolbar"><strong>{journey.departure} → {journey.arrival} · {Math.ceil(journey.durationSeconds / 60)} min</strong><button onClick={() => setSatellite(!satellite)}>{satellite ? t.map : t.satellite}</button></div><TransitMap points={points} satellite={satellite} label="Mapped scheduled journey" /><div className="journeySummary"><h3>{journey.recommendation.title}</h3><p>{journey.walkingMeters} m walk guidance · {journey.transfers} transfers</p>{journey.rides.map((ride, index) => <div className="compactLeg" key={`${ride.route}-${index}`}><strong>{ride.mode === "walk" ? "Walk" : ride.route}</strong><span>{ride.departure} {ride.from.name} → {ride.arrival} {ride.to.name}</span></div>)}<button className="secondaryButton" onClick={() => onSave(journey)}>{savedMessage || t.save}</button></div></> : <div className="emptyFeature"><strong>Plan across Bengaluru</strong><p>Search a landmark or choose a verified bus or Metro stop to begin.</p></div>}</div></div>;
}

function AirportPlanner({ t, date, time, setDate, setTime, satellite, setSatellite, onSave, savedMessage }: any) {
  const [mode, setMode] = useState<"to_airport" | "from_airport">("to_airport"); const [query, setQuery] = useState(""); const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routes, setRoutes] = useState<AirportRoute[]>([]); const [selected, setSelected] = useState<AirportRoute | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function search(event?: FormEvent) { event?.preventDefault(); setLoading(true); setError(""); const params = new URLSearchParams({ mode, date, after: time }); if (query) params.set("q", query); if (location) { params.set("lat", String(location.latitude)); params.set("lon", String(location.longitude)); } try { const body = await responseJson(await fetch(`/api/airport?${params}`)); setRoutes(body.routes); setSelected(body.routes[0] ?? null); if (!body.routes.length) setError(t.noResult); window.localStorage.setItem("nammalink:last-sync", new Date().toISOString()); } catch (reason) { setError(reason instanceof Error ? reason.message : t.noResult); } finally { setLoading(false); } }
  function locate() { navigator.geolocation?.getCurrentPosition((position) => { setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setQuery("Current location"); }, () => setError("Location permission denied; enter a corridor or landmark."), { timeout: 8000 }); }
  const points = useMemo(() => selected?.stops.map((stop, index) => ({ lat: stop.lat, lon: stop.lon, name: stop.name, role: index === 0 ? "origin" as const : index === selected.stops.length - 1 ? "destination" as const : "stop" as const })) ?? [], [selected]);
  function officialHandoff() { const event = { id: crypto.randomUUID(), type: "outbound_click", partner: "Namma BMTC 2.0", at: new Date().toISOString(), verifiedConversion: false }; const prior = JSON.parse(localStorage.getItem("nammalink:referrals") || "[]"); localStorage.setItem("nammalink:referrals", JSON.stringify([...prior, event].slice(-100))); window.open("https://play.google.com/store/apps/details?id=com.bmtc.bmtcavls.two", "_blank", "noopener,noreferrer"); }
  return <div className="featureGrid"><form className="featurePanel" onSubmit={search}><div className="directionSwitch"><button type="button" className={mode === "to_airport" ? "active" : ""} onClick={() => setMode("to_airport")}>{t.toAirport}</button><button type="button" className={mode === "from_airport" ? "active" : ""} onClick={() => setMode("from_airport")}>{t.fromAirport}</button></div><label>Corridor or landmark<input value={query} onChange={(event) => { setQuery(event.target.value); setLocation(null); }} placeholder="Silk Board, HSR, Whitefield…" /></label><button type="button" className="secondaryButton" onClick={locate}>⌖ {t.locate}</button><div className="dateRow"><label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>After<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div><button className="searchButton" disabled={loading}>{loading ? "Checking schedules…" : t.findAirport}</button><p className="guidanceNote">Scheduled KIA service information · updated from the 20260907 feed.</p><p className="guidanceNote">{t.historical}</p>{error && <p className="inlineError">{error}</p>}<div className="routePicker">{routes.slice(0, 10).map((route) => <button type="button" className={selected?.id === route.id ? "active" : ""} key={route.id} onClick={() => setSelected(route)}><strong>{route.route}</strong><span>{route.direction === "to_airport" ? route.origin.name : route.destination.name}{route.proximityMeters !== null ? ` · ${(route.proximityMeters / 1000).toFixed(1)} km` : ""}</span></button>)}</div></form><div className="featureResults">{selected ? <><div className="mapToolbar"><strong>{selected.route} · {selected.stops.length} verified stops</strong><button onClick={() => setSatellite(!satellite)}>{satellite ? t.map : t.satellite}</button></div><TransitMap points={points} satellite={satellite} label={`${selected.route} airport route map`} /><div className="journeySummary"><h3>{selected.direction === "to_airport" ? selected.origin.name : "Kempegowda International Airport"}</h3><p>Next scheduled origin departures: {selected.upcoming.length ? selected.upcoming.map((item) => `${item.departure} (${item.waitMinutes} min)`).join(" · ") : "No later departure in this service day"}</p><p>{selected.fareRange ? `Published fare range: ₹${selected.fareRange.minimum}–₹${selected.fareRange.maximum}. Confirm the current fare in the operator app.` : "Current route fare unavailable. Check the operator app before travel."}</p><details><summary>View all intermediate stops</summary><ol className="airportStops">{selected.stops.map((stop) => <li key={`${stop.id}-${stop.departure}`}><strong>{stop.name}</strong><span>{stop.departure}</span></li>)}</ol></details><div className="actionRow"><button className="secondaryButton" onClick={() => onSave(selected)}>{savedMessage || t.save}</button><button className="partnerButton" onClick={officialHandoff}>{t.ticket}</button></div><small>Booking continues in the official Namma BMTC app.</small></div></> : <div className="emptyFeature"><strong>Airport Mode</strong><p>Find KIA services, departure times, route maps and intermediate stops.</p></div>}</div></div>;
}

function OfflinePanel({ t, lastSync }: { t: typeof copy.en; lastSync: string | null }) {
  const [heading, setHeading] = useState<number | null>(null); const [clicks, setClicks] = useState(0); const [commission, setCommission] = useState(5);
  useEffect(() => { const events = JSON.parse(localStorage.getItem("nammalink:referrals") || "[]"); setClicks(events.filter((event: { type: string }) => event.type === "outbound_click").length); const listener = (event: DeviceOrientationEvent) => setHeading(event.alpha === null ? null : Math.round(event.alpha)); window.addEventListener("deviceorientation", listener); return () => window.removeEventListener("deviceorientation", listener); }, []);
  const savedCity = typeof window !== "undefined" && localStorage.getItem("nammalink:saved:city"); const savedAirport = typeof window !== "undefined" && localStorage.getItem("nammalink:saved:airport");
  return <div className="offlineGrid"><article className="offlineCard"><h3>Saved journeys</h3><p>City journey: <strong>{savedCity ? "available" : "not saved"}</strong></p><p>Airport route: <strong>{savedAirport ? "available" : "not saved"}</strong></p><p>Last successful sync: <strong>{lastSync ? new Date(lastSync).toLocaleString() : "not yet"}</strong></p><p>Reconnect before travel to refresh saved schedules and map tiles.</p></article><article className="offlineCard"><h3>Compass assistance</h3><div className="compass" style={{ transform: `rotate(${-(heading ?? 0)}deg)` }}>↑<span>N</span></div><p>{heading === null ? "Compass sensor unavailable or permission not granted." : `Device heading ${heading}°.`}</p><p>Use the map and itinerary together for navigation.</p></article><article className="offlineCard revenueCard"><h3>Partner referrals</h3><p>Ticketing links opened on this device: <strong>{clicks}</strong></p><p>Bookings are completed in the official operator app.</p><label>Estimated referral value per eligible booking (₹)<input type="number" min="0" max="100" value={commission} onChange={(event) => setCommission(Number(event.target.value))} /></label><p className="hypothetical">Potential value at the selected rate: ₹{clicks * commission}. Final earnings depend on a partner agreement and confirmed bookings.</p></article></div>;
}
