"use client";

import { useEffect, useState } from "react";

export function ConnectivityStatus() {
  const [status, setStatus] = useState<"checking" | "online" | "offline" | "backend-down">("checking");

  useEffect(() => {
    let active = true;
    const update = async () => {
      if (!navigator.onLine) {
        if (active) setStatus("offline");
        return;
      }
      if (active) setStatus("checking");
      try {
        const response = await fetch("/api/health", { cache: "no-store", signal: AbortSignal.timeout(4_000) });
        if (active) setStatus(response.ok ? "online" : "backend-down");
      } catch {
        if (active) setStatus("backend-down");
      }
    };
    void update();
    const interval = window.setInterval(() => void update(), 30_000);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    }
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <div className={`connectivityStatus ${status === "online" ? "online" : "offline"}`} role="status">
      <span aria-hidden="true" />
      {status === "online" && "Service ready"}
      {status === "checking" && "Checking service…"}
      {status === "offline" && "Offline · saved journeys only"}
      {status === "backend-down" && "Service unavailable · saved journeys only"}
    </div>
  );
}
