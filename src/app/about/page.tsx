import { GlassCard } from "@/components/GlassCard";
import { SectionHeader } from "@/components/SectionHeader";
import { Cpu, Wifi, Radio, Server, ShieldCheck, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">About Proximo</h1>
        <p className="text-sm text-muted">Microcontroller-based proximity detection & live IoT telemetry</p>
      </div>

      {/* System Overview */}
      <GlassCard className="p-6">
        <SectionHeader title="System Architecture" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="p-4 rounded-lg bg-card/50 border border-border/60 space-y-2">
            <div className="flex items-center gap-2 text-accent">
              <Radio className="h-5 w-5" />
              <span className="font-semibold text-sm">HC-SR04</span>
            </div>
            <p className="text-xs text-muted">Ultrasonic sensor measuring distance from 2 cm to 400 cm.</p>
          </div>

          <div className="p-4 rounded-lg bg-card/50 border border-border/60 space-y-2">
            <div className="flex items-center gap-2 text-accent">
              <Cpu className="h-5 w-5" />
              <span className="font-semibold text-sm">ESP32-WROOM</span>
            </div>
            <p className="text-xs text-muted">Dual-core MCU running real-time polling, buzzer alert, and WiFi.</p>
          </div>

          <div className="p-4 rounded-lg bg-card/50 border border-border/60 space-y-2">
            <div className="flex items-center gap-2 text-accent">
              <Wifi className="h-5 w-5" />
              <span className="font-semibold text-sm">Firebase RTDB</span>
            </div>
            <p className="text-xs text-muted">Ultra low-latency WebSocket sync on asia-southeast1 cluster.</p>
          </div>

          <div className="p-4 rounded-lg bg-card/50 border border-border/60 space-y-2">
            <div className="flex items-center gap-2 text-accent">
              <Server className="h-5 w-5" />
              <span className="font-semibold text-sm">Next.js 16</span>
            </div>
            <p className="text-xs text-muted">App Router frontend with dark theme design tokens & zero bloat.</p>
          </div>
        </div>
      </GlassCard>

      {/* Step 8 Placeholder */}
      <GlassCard hover className="p-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/30 shadow-[0_0_25px_rgba(34,211,238,0.2)]">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent ring-1 ring-inset ring-accent/20">
              Coming in Step 8
            </span>
            <h2 className="text-xl font-semibold text-text">Interactive Diagrams & Technical Specs</h2>
            <p className="text-sm text-muted max-w-xl">
              Pin mapping tables, wiring schematic view, team credits, and deep-dive technical benchmarks.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Design System Reference */}
      <GlassCard className="p-6 space-y-4">
        <SectionHeader title="Design Tokens & Standards" />
        <p className="text-xs text-muted">
          Strict dark-only palette inspired by deep ocean sonar / radar displays.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-card border border-border text-center">
            <div className="h-4 w-4 rounded-full bg-accent mx-auto mb-1.5 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            <span className="text-xs font-medium text-text">Cyan Accent</span>
            <p className="text-[10px] text-muted font-mono">#22D3EE</p>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border text-center">
            <div className="h-4 w-4 rounded-full bg-success mx-auto mb-1.5 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            <span className="text-xs font-medium text-text">Success</span>
            <p className="text-[10px] text-muted font-mono">#34D399</p>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border text-center">
            <div className="h-4 w-4 rounded-full bg-warning mx-auto mb-1.5 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <span className="text-xs font-medium text-text">Warning</span>
            <p className="text-[10px] text-muted font-mono">#F59E0B</p>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border text-center">
            <div className="h-4 w-4 rounded-full bg-danger mx-auto mb-1.5 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
            <span className="text-xs font-medium text-text">Danger</span>
            <p className="text-[10px] text-muted font-mono">#F43F5E</p>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border text-center">
            <div className="h-4 w-4 rounded-full bg-card border border-border mx-auto mb-1.5" />
            <span className="text-xs font-medium text-text">Card Surface</span>
            <p className="text-[10px] text-muted font-mono">#121A2B</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

