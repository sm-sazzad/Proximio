import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FirebaseProviders } from "@/context/FirebaseProviders";
import { AmbientBackground } from "@/components/AmbientBackground";
import { AppShell } from "@/components/AppShell";
import { PageTransition } from "@/components/PageTransition";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://proximo.local"),
  title: {
    default: "Proximo — Real-Time IoT Distance Telemetry",
    template: "%s · Proximo",
  },
  description:
    "An ESP32 and ultrasonic sensor measure distance live. Real-time sweeping radar, live charts, kinematics speed analysis, and cloud remote control.",
  keywords: [
    "ESP32",
    "Ultrasonic Sensor",
    "HC-SR04",
    "IoT",
    "Distance Monitor",
    "Telemetry",
    "Firebase",
    "Next.js",
  ],
  icons: {
    icon: [
      { url: "/logo.png?v=3", type: "image/png" },
      { url: "/icon.png?v=3", type: "image/png" },
    ],
    shortcut: "/logo.png?v=3",
    apple: "/logo.png?v=3",
  },
  openGraph: {
    title: "Proximo — Real-Time IoT Distance Telemetry",
    description: "Proximity, in real time. Microcontroller telemetry, radar sweeps, and live controls.",
    siteName: "Proximo",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Proximo — Real-Time IoT Distance Telemetry",
    description: "Proximity, in real time. Microcontroller telemetry, radar sweeps, and live controls.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-bg text-text">
        <FirebaseProviders>
          <AmbientBackground />
          <AppShell>
            <PageTransition>{children}</PageTransition>
          </AppShell>
          <Toaster theme="dark" position="bottom-right" richColors />
        </FirebaseProviders>
      </body>
    </html>
  );
}
