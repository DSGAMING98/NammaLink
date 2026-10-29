import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NammaLink — Reach on Time, Wait Less",
    short_name: "NammaLink",
    description: "Constraint-aware scheduled public transport planning for Bengaluru.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f0e8",
    theme_color: "#07130f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
