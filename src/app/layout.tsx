import type { Metadata } from "next";
import "@/styles/globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Api's Mazvall — REST API Platform & Documentation",
  description: "Professional REST API platform with interactive documentation, rate limiting, and developer tools. Base URL: https://api-mazval.zone.id",
  keywords: ["API", "REST", "documentation", "Mazvall", "developer tools"],
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
