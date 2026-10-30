"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

export type MapPoint = { lat: number; lon: number; name: string; role?: "origin" | "destination" | "transfer" | "stop" };

export function TransitMap({ points, satellite, label }: { points: MapPoint[]; satellite: boolean; label: string }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let disposed = false;
    void import("leaflet").then((L) => {
      if (disposed || !element.current) return;
      map.current?.remove();
      const nextMap = L.map(element.current, { zoomControl: true, attributionControl: true });
      map.current = nextMap;
      L.tileLayer(
        satellite
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 19, attribution: satellite ? "Tiles © Esri" : "© OpenStreetMap contributors" },
      ).addTo(nextMap);
      const coordinates = points.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon)).map((point) => [point.lat, point.lon] as [number, number]);
      if (!coordinates.length) { nextMap.setView([12.9716, 77.5946], 10); return; }
      L.polyline(coordinates, { color: "#0f7958", weight: 6, opacity: .9 }).addTo(nextMap);
      points.forEach((point, index) => {
        const color = point.role === "origin" ? "#0f7958" : point.role === "destination" ? "#d4102f" : point.role === "transfer" ? "#7a2e87" : "#183a61";
        L.circleMarker([point.lat, point.lon], { radius: index === 0 || index === points.length - 1 ? 8 : 4, color: "white", weight: 2, fillColor: color, fillOpacity: 1 })
          .bindTooltip(point.name)
          .addTo(nextMap);
      });
      nextMap.fitBounds(L.latLngBounds(coordinates).pad(.12), { maxZoom: 15 });
      setTimeout(() => nextMap.invalidateSize(), 0);
    });
    return () => { disposed = true; map.current?.remove(); map.current = null; };
  }, [points, satellite]);

  return <div className="transitMap" ref={element} role="img" aria-label={label} />;
}
