import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FirebaseProviders } from "@/context/FirebaseProviders";
import { AmbientBackground } from "@/components/AmbientBackground";
import { AppShell } from "@/components/AppShell";
import { PageTransition } from "@/components/PageTransition";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Proximo",
  description: "Real-time distance monitoring dashboard",
  icons: {
    icon: "/icon.svg",
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
        </FirebaseProviders>
      </body>
    </html>
  );
}
