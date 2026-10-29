import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NammaLink — Reach on Time, Wait Less",
  description: "Constraint-aware public transport journey recovery for Bengaluru.",
};

export const viewport: Viewport = {
  themeColor: "#07130f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

