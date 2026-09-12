import type { Metadata } from "next";
import "@/styles/globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Api's Mazvall — Platform API REST & Dokumentasi",
  description: "Platform API REST profesional dengan dokumentasi interaktif, rate limit, dan tools developer. Base URL: https://api-mazval.zone.id",
  keywords: ["API", "REST", "dokumentasi", "Mazvall", "tools developer", "rate limit"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="noise-overlay" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
