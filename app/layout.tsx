import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BrandSplash } from "@/app/components/brand-splash";
import { ConnectivityStatus } from "@/app/components/connectivity-status";

export const metadata: Metadata = {
  title: "NammaLink — Reach on Time, Wait Less",
  description: "Constraint-aware public transport journey recovery for Bengaluru.",
  icons: {
    icon: [{ url: "/assets/nammalink-logo.png", type: "image/png", sizes: "1254x1254" }],
    apple: [{ url: "/assets/nammalink-logo.png", type: "image/png", sizes: "1254x1254" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#07130f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><BrandSplash /><ConnectivityStatus />{children}</body>
    </html>
  );
}

