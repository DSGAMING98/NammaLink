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
    icons: [
      {
        src: "/assets/nammalink-logo.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/nammalink-logo.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
