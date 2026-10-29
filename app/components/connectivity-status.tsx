"use client";

import { useEffect, useState } from "react";

export function ConnectivityStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    }
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <div className={`connectivityStatus ${online ? "online" : "offline"}`} role="status">
      <span aria-hidden="true" />
      {online ? "Online" : "Offline · saved journeys only"}
    </div>
  );
}
