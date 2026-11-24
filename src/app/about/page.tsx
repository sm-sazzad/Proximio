"use client";

import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import { SectionHeader } from "@/components/SectionHeader";
import { ProximoLogo } from "@/components/ProximoLogo";
import { projectConfig } from "@/config/project";
import {
  Cpu,
  Radio,
  Flame,
  LayoutDashboard,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Activity,
  Sliders,
  History,
  ShieldAlert,
  Cloud,
  CheckCircle2,
  Users,
  GraduationCap,
  Layers,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Architecture Flow Diagram (Responsive: Horizontal on desktop, Vertical on mobile) */
function ArchitectureDiagram() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="w-full space-y-6">
      {/* ── DESKTOP FLOW (md+) ─────────────────────────────────────── */}
      <div className="hidden md:block relative p-6 rounded-2xl bg-white/[0.015] border border-border/40">
        <div className="grid grid-cols-3 gap-8 items-center relative z-10">
          {/* Node 1: Edge MCU */}
          <div className="p-5 rounded-xl border border-accent/30 bg-card/80 backdrop-blur-md space-y-2 text-center shadow-[0_0_20px_rgba(34,211,238,0.08)]">
            <div className="h-10 w-10 mx-auto rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text">ESP32-WROOM</h3>
              <p className="text-[11px] text-muted">Edge Microcontroller</p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-muted/80 space-y-0.5 border-t border-border/40">
              <p>HC-SR04 Sensor</p>
              <p>Active Buzzer &amp; 16x2 LCD</p>
            </div>
          </div>

          {/* Node 2: Firebase Realtime Database */}
          <div className="p-5 rounded-xl border border-warning/30 bg-card/80 backdrop-blur-md space-y-2 text-center shadow-[0_0_20px_rgba(245,158,11,0.08)]">
            <div className="h-10 w-10 mx-auto rounded-lg bg-warning/10 border border-warning/30 flex items-center justify-center text-warning">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text">Firebase RTDB</h3>
              <p className="text-[11px] text-muted">Cloud Synchronization</p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-muted/80 space-y-0.5 border-t border-border/40">
              <p>WebSocket Sync (~1s)</p>
              <p>asia-southeast1 Cluster</p>
            </div>
          </div>

          {/* Node 3: Next.js Client Dashboard */}
          <div className="p-5 rounded-xl border border-success/30 bg-card/80 backdrop-blur-md space-y-2 text-center shadow-[0_0_20px_rgba(52,211,153,0.08)]">
            <div className="h-10 w-10 mx-auto rounded-lg bg-success/10 border border-success/30 flex items-center justify-center text-success">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text">Proximo Client</h3>
              <p className="text-[11px] text-muted">Next.js 16 Web Dashboard</p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-muted/80 space-y-0.5 border-t border-border/40">
              <p>Radar, Charts, Audio Alert</p>
              <p>Responsive Any Device</p>
            </div>
          </div>
        </div>

        {/* Dual Directional Paths */}
        <div className="mt-6 pt-5 border-t border-border/40 space-y-4">
          {/* Telemetry Line (ESP32 -> Firebase -> Client) */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-accent shrink-0 w-28">
              /live telemetry
            </span>
            <div className="flex-1 relative h-2 rounded-full bg-white/[0.04] overflow-hidden border border-accent/20">
              {!prefersReducedMotion && (
                <>
                  <motion.div
                    className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-accent to-transparent"
                    animate={{ left: ["-10%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-accent to-transparent"
                    animate={{ left: ["-10%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear", delay: 1 }}
                  />
                </>
              )}
            </div>
            <span className="text-[10px] font-mono text-muted shrink-0 flex items-center gap-1">
              ESP32 <ArrowRight className="h-3 w-3 text-accent" /> Cloud <ArrowRight className="h-3 w-3 text-accent" /> Web
            </span>
          </div>

          {/* Control Settings Line (Client -> Firebase -> ESP32) */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-warning shrink-0 w-28">
              /control settings
            </span>
            <div className="flex-1 relative h-2 rounded-full bg-white/[0.04] overflow-hidden border border-warning/20">
              {!prefersReducedMotion && (
                <>
                  <motion.div
                    className="absolute top-0 bottom-0 w-8 bg-gradient-to-l from-transparent via-warning to-transparent"
                    animate={{ right: ["-10%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute top-0 bottom-0 w-8 bg-gradient-to-l from-transparent via-warning to-transparent"
                    animate={{ right: ["-10%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 2.4, ease: "linear", delay: 1.2 }}
                  />
                </>
              )}
            </div>
            <span className="text-[10px] font-mono text-muted shrink-0 flex items-center gap-1">
              Web <ArrowLeft className="h-3 w-3 text-warning" /> Cloud <ArrowLeft className="h-3 w-3 text-warning" /> ESP32
            </span>
          </div>
        </div>
      </div>

      {/* ── MOBILE FLOW (<md / 360px Stacked) ───────────────────────── */}
      <div className="md:hidden space-y-3">
        {/* Step 1: ESP32 */}
        <div className="p-4 rounded-xl border border-accent/30 bg-card/80 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-text truncate">ESP32-WROOM MCU</h4>
            <p className="text-[11px] text-muted">HC-SR04 ultrasonic + Active buzzer</p>
          </div>
        </div>

        {/* Down/Up Connector 1 */}
        <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-muted py-0.5">
          <span className="flex items-center gap-1 text-accent">
            <ArrowDown className="h-3.5 w-3.5" /> /live telemetry
          </span>
          <span className="flex items-center gap-1 text-warning">
            <ArrowUp className="h-3.5 w-3.5" /> /control
          </span>
        </div>

        {/* Step 2: Firebase */}
        <div className="p-4 rounded-xl border border-warning/30 bg-card/80 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-warning/10 border border-warning/30 flex items-center justify-center text-warning">
            <Flame className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-text truncate">Firebase Realtime DB</h4>
            <p className="text-[11px] text-muted">WebSocket sync (~1s telemetry, ~3s control)</p>
          </div>
        </div>

        {/* Down/Up Connector 2 */}
        <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-muted py-0.5">
          <span className="flex items-center gap-1 text-accent">
            <ArrowDown className="h-3.5 w-3.5" /> /live stream
          </span>
          <span className="flex items-center gap-1 text-warning">
            <ArrowUp className="h-3.5 w-3.5" /> settings push
          </span>
        </div>

        {/* Step 3: Web Dashboard */}
        <div className="p-4 rounded-xl border border-success/30 bg-card/80 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-success/10 border border-success/30 flex items-center justify-center text-success">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-text truncate">Proximo Web Client</h4>
            <p className="text-[11px] text-muted">Real-time radar, charts, audio &amp; remote slider</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-8">
      {/* ── 1. Hero Section ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                <ProximoLogo size={32} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
                  {projectConfig.projectName}
                </h1>
                <p className="text-sm font-medium text-accent">
                  {projectConfig.tagline}
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-muted/90 leading-relaxed">
              {projectConfig.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted font-mono">
              <span className="flex items-center gap-1.5 rounded-md bg-white/[0.03] border border-border/50 px-2.5 py-1">
                <GraduationCap className="h-3.5 w-3.5 text-accent" />
                {projectConfig.courseName}
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-white/[0.03] border border-border/50 px-2.5 py-1">
                <Users className="h-3.5 w-3.5 text-accent" />
                {projectConfig.institution}
              </span>
              {projectConfig.instructor && (
                <span className="flex items-center gap-1.5 rounded-md bg-accent/10 border border-accent/30 px-2.5 py-1 text-accent font-semibold">
                  <GraduationCap className="h-3.5 w-3.5 text-accent" />
                  Instructor: {projectConfig.instructor}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 hidden lg:flex flex-col items-end text-right font-mono text-xs text-muted/70 space-y-1">
            <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold">
              v1.0 Production
            </span>
            <span>Cluster: asia-southeast1</span>
            <span>Latency: &lt; 100ms WebSocket</span>
          </div>
        </div>
      </div>

      {/* ── 2. Animated Architecture Flow ───────────────────────────────── */}
      <GlassCard hover className="p-6 sm:p-8 space-y-6">
        <div>
          <SectionHeader
            title="System Architecture Flow"
            icon={<Layers className="h-4 w-4" />}
            className="mb-1"
          />
          <p className="text-xs text-muted">
            End-to-end bidirectional data stream between the edge ultrasonic node and the Next.js client.
          </p>
        </div>

        <ArchitectureDiagram />
      </GlassCard>

      {/* ── 3. How It Works (Four Steps) ─────────────────────────────────── */}
      <div className="space-y-4">
        <SectionHeader
          title="How It Works"
          icon={<Activity className="h-4 w-4" />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1: Measure */}
          <GlassCard hover className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-accent">01</span>
              <Radio className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-base font-bold text-text">1. Measure</h3>
            <p className="text-xs text-muted leading-relaxed">
              The HC-SR04 ultrasonic transducer emits 40 kHz pulses and measures echo bounce time to calculate distance with high precision.
            </p>
          </GlassCard>

          {/* Step 2: Send */}
          <GlassCard hover className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-accent">02</span>
              <Flame className="h-4 w-4 text-warning" />
            </div>
            <h3 className="text-base font-bold text-text">2. Send</h3>
            <p className="text-xs text-muted leading-relaxed">
              The ESP32 microcontroller packages distance, uptime, RSSI, and alarm counters into a JSON telemetry payload pushed to Firebase RTDB every second.
            </p>
          </GlassCard>

          {/* Step 3: Display */}
          <GlassCard hover className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-accent">03</span>
              <LayoutDashboard className="h-4 w-4 text-success" />
            </div>
            <h3 className="text-base font-bold text-text">3. Display</h3>
            <p className="text-xs text-muted leading-relaxed">
              The client subscribes once via WebSocket, animating a 180° sweeping radar, live area charts, and kinematics speed insights in real time.
            </p>
          </GlassCard>

          {/* Step 4: Control */}
          <GlassCard hover className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-accent">04</span>
              <Sliders className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-base font-bold text-text">4. Control</h3>
            <p className="text-xs text-muted leading-relaxed">
              Operators adjust threshold sliders and arming switches on the web. Settings sync back to the ESP32 within ~3 seconds without firmware reflash.
            </p>
          </GlassCard>
        </div>
      </div>

      {/* ── 4 & 5. Hardware List & Pin Mapping Table ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hardware List (5 cols) */}
        <GlassCard hover className="lg:col-span-5 p-6 flex flex-col">
          <div>
            <SectionHeader
              title="Hardware Bill of Materials"
              icon={<Cpu className="h-4 w-4" />}
              className="mb-1"
            />
            <p className="text-xs text-muted mb-4">
              Physical components integrated into the edge sensor node.
            </p>
          </div>

          <ul className="flex-1 flex flex-col justify-between gap-2.5 text-xs">
            {[
              {
                name: "ESP32-WROOM DevKit",
                desc: "Dual-core 240MHz MCU with 2.4GHz WiFi & BLE",
              },
              {
                name: "HC-SR04 Ultrasonic Sensor",
                desc: "Range: 2 cm to 400 cm (non-contact sonar)",
              },
              {
                name: "SG90 Micro Servo Motor",
                desc: "180° positional actuator for physical gate/dial",
              },
              {
                name: "5mm Indicator LED Light",
                desc: "Remote-switched optical indicator lamp (D32)",
              },
              {
                name: "Active Buzzer",
                desc: "High-decibel audible alarm sounder (GPIO27)",
              },
              {
                name: "16x2 Character LCD",
                desc: "Local telemetry display in 4-bit parallel mode",
              },
              {
                name: "10kΩ Potentiometer",
                desc: "Analog contrast adjustment for LCD (V0 pin)",
              },
              {
                name: "Breadboard & Jumper Wires",
                desc: "Prototyping interconnect harness & DuPont lines",
              },
            ].map((hw) => (
              <li
                key={hw.name}
                className="flex-1 flex items-center gap-3 px-3.5 py-3 rounded-lg bg-white/[0.02] border border-border/40 hover:border-accent/30 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-text block leading-snug">{hw.name}</span>
                  <span className="text-[11px] text-muted block leading-snug">{hw.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Pin Mapping Table (7 cols) */}
        <GlassCard hover className="lg:col-span-7 p-6 space-y-4">
          <div>
            <SectionHeader
              title="ESP32 Wiring & Pin Map"
              icon={<Radio className="h-4 w-4" />}
              className="mb-1"
            />
            <p className="text-xs text-muted">
              Authoritative GPIO assignment table matching the firmware pinouts.
            </p>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-2 font-semibold">Device</th>
                  <th className="pb-2 font-semibold">Device Pin</th>
                  <th className="pb-2 font-semibold text-accent">ESP32 Pin</th>
                  <th className="pb-2 font-semibold">Function</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-text/90">
                {/* HC-SR04 */}
                <tr>
                  <td className="py-2 font-sans font-medium text-accent">HC-SR04</td>
                  <td className="py-2">VCC</td>
                  <td className="py-2 text-accent font-bold">3V3</td>
                  <td className="py-2 text-muted">Power 3.3V</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium text-accent">HC-SR04</td>
                  <td className="py-2">Trig</td>
                  <td className="py-2 text-accent font-bold">GPIO25</td>
                  <td className="py-2 text-muted">Pulse Trigger</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium text-accent">HC-SR04</td>
                  <td className="py-2">Echo</td>
                  <td className="py-2 text-accent font-bold">GPIO26</td>
                  <td className="py-2 text-muted">Echo Receiver</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium text-accent">HC-SR04</td>
                  <td className="py-2">GND</td>
                  <td className="py-2 text-accent font-bold">GND</td>
                  <td className="py-2 text-muted">Common Ground</td>
                </tr>

                {/* Buzzer */}
                <tr>
                  <td className="py-2 font-sans font-medium text-warning">Buzzer</td>
                  <td className="py-2">+</td>
                  <td className="py-2 text-warning font-bold">GPIO27</td>
                  <td className="py-2 text-muted">Alarm Digital Out</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium text-warning">Buzzer</td>
                  <td className="py-2">-</td>
                  <td className="py-2 text-warning font-bold">GND</td>
                  <td className="py-2 text-muted">Common Ground</td>
                </tr>

                {/* LED Light */}
                <tr>
                  <td className="py-2 font-sans font-medium text-accent">LED Light</td>
                  <td className="py-2">Anode (Long pin / +)</td>
                  <td className="py-2 text-accent font-bold">GPIO32 (D32)</td>
                  <td className="py-2 text-muted">Optical Indicator Control</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium text-accent">LED Light</td>
                  <td className="py-2">Cathode (Short pin / -)</td>
                  <td className="py-2 text-accent font-bold">GND</td>
                  <td className="py-2 text-muted">Common Ground</td>
                </tr>

                {/* SG90 Micro Servo Motor */}
                <tr>
                  <td className="py-2 font-sans font-medium text-warning">SG90 Servo</td>
                  <td className="py-2">Signal (Yellow)</td>
                  <td className="py-2 text-warning font-bold">GPIO33 (D33)</td>
                  <td className="py-2 text-muted">PWM Servo Signal Output</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium text-warning">SG90 Servo</td>
                  <td className="py-2">VCC (Red)</td>
                  <td className="py-2 text-warning font-bold">5V (VIN)</td>
                  <td className="py-2 text-muted">Servo Motor Power Supply</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium text-warning">SG90 Servo</td>
                  <td className="py-2">GND (Brown / বাদামী)</td>
                  <td className="py-2 text-warning font-bold">GND</td>
                  <td className="py-2 text-muted">Common Ground</td>
                </tr>

                {/* LCD 16x2 */}
                <tr>
                  <td className="py-2 font-sans font-medium text-text">LCD 16x2</td>
                  <td className="py-2">RS / E</td>
                  <td className="py-2 text-text font-bold">GPIO22 / GPIO23</td>
                  <td className="py-2 text-muted">Register Select &amp; Enable</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium text-text">LCD 16x2</td>
                  <td className="py-2">D4, D5, D6, D7</td>
                  <td className="py-2 text-text font-bold">GPIO21, 19, 18, 17</td>
                  <td className="py-2 text-muted">4-bit Data Lines</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium text-text">LCD 16x2</td>
                  <td className="py-2">VDD / BLA</td>
                  <td className="py-2 text-text font-bold">5V (VIN)</td>
                  <td className="py-2 text-muted">Logic &amp; Backlight Power</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium text-text">LCD 16x2</td>
                  <td className="py-2">V0</td>
                  <td className="py-2 text-text font-bold">Potentiometer Wiper</td>
                  <td className="py-2 text-muted">Contrast Control</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium text-text">LCD 16x2</td>
                  <td className="py-2">RW / BLK</td>
                  <td className="py-2 text-text font-bold">GND</td>
                  <td className="py-2 text-muted">Write Mode &amp; Backlight Cathode</td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* ── 6. Key Features Grid ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionHeader
          title="Key Features"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Radio,
              title: "Live Radar Gauge",
              desc: "180° continuous sweeping sonar gauge with blip tracking and colored intrusion alert arc.",
            },
            {
              icon: Activity,
              title: "Rolling Live Chart",
              desc: "Smooth real-time area chart with 1m/5m windows, relative X ticks, and clean null gap handling.",
            },
            {
              icon: Sliders,
              title: "Remote Control Panel",
              desc: "Dual-handle range sliders with instant draft validation, buzzer toggle, and safe cloud sync.",
            },
            {
              icon: History,
              title: "Alarm History & Analytics",
              desc: "24-hour hourly distribution bar charts, closeness donut breakdown, and one-click CSV export.",
            },
            {
              icon: ShieldAlert,
              title: "Smart Kinematics",
              desc: "Weighted linear regression computes approaching/moving-away direction, speed in cm/s, and arrival ETAs.",
            },
            {
              icon: Cloud,
              title: "Free Cloud Infrastructure",
              desc: "Fully functional architecture built entirely on free-tier Firebase RTDB and Vercel hosting.",
            },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <GlassCard key={feat.title} hover className="p-5 space-y-2">
                <div className="flex items-center gap-2 text-accent">
                  <Icon className="h-4 w-4" />
                  <h4 className="font-bold text-sm text-text">{feat.title}</h4>
                </div>
                <p className="text-xs text-muted leading-relaxed">{feat.desc}</p>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* ── 7. Firmware Environment & Arduino Libraries ────────────────── */}
      <GlassCard hover className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div>
            <SectionHeader
              title="Firmware Environment & Arduino Libraries"
              icon={<Cpu className="h-4 w-4" />}
              className="mb-1"
            />
            <p className="text-xs text-muted">
              Official board core and Arduino Library Manager packages required to flash the ESP32 firmware.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-accent bg-accent/10 border border-accent/30 px-3 py-1.5 rounded-lg">
            <span>Board: ESP32 Dev Module</span>
          </div>
        </div>

        {/* Board Package Setup Note */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-text block">
              Boards Manager Package: <code className="text-accent font-mono">esp32</code> by Espressif Systems
            </span>
            <p className="text-[11px] text-muted">
              In Arduino IDE Boards Manager, search for <strong>esp32</strong> and install the official package. Select <strong>ESP32 Dev Module</strong> from Tools &gt; Board.
            </p>
          </div>
          <span className="shrink-0 font-mono text-[11px] text-success bg-success/10 border border-success/30 px-2.5 py-1 rounded">
            Espressif Core
          </span>
        </div>

        {/* Arduino Libraries Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-text font-mono uppercase tracking-wider">
            Required Libraries (Library Manager)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-2 font-semibold">Library</th>
                  <th className="pb-2 font-semibold">Author</th>
                  <th className="pb-2 font-semibold text-accent">Purpose / Function</th>
                  <th className="pb-2 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-text/90">
                <tr>
                  <td className="py-2.5 font-bold text-accent">LiquidCrystal</td>
                  <td className="py-2.5 text-muted">Arduino, Adafruit</td>
                  <td className="py-2.5 text-text">16x2 Character LCD Driver (4-bit parallel mode)</td>
                  <td className="py-2.5 text-muted">Library Manager</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-accent">WiFiManager</td>
                  <td className="py-2.5 text-muted">tzapu</td>
                  <td className="py-2.5 text-text">Mobile Captive Portal for WiFi Configuration without hardcoded credentials</td>
                  <td className="py-2.5 text-muted">Library Manager</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-accent">ArduinoJson</td>
                  <td className="py-2.5 text-muted">Benoit Blanchon (v7.x)</td>
                  <td className="py-2.5 text-text">Fast JSON Serialization &amp; Firebase RTDB Payload Parser</td>
                  <td className="py-2.5 text-muted">Library Manager</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-accent">ESP32Servo</td>
                  <td className="py-2.5 text-muted">Kevin Harrington, John K. Bennett</td>
                  <td className="py-2.5 text-text">SG90 180° Micro Servo Motor PWM Actuator Control</td>
                  <td className="py-2.5 text-muted">Library Manager</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>

      {/* ── 8. Tech Stack Chips ──────────────────────────────────────────── */}
      <GlassCard className="p-6 space-y-4">
        <SectionHeader title="Technology Stack" icon={<Layers className="h-4 w-4" />} />
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            "ESP32",
            "Arduino C++",
            "LiquidCrystal",
            "WiFiManager",
            "ArduinoJson (v7.x)",
            "ESP32Servo",
            "Firebase Realtime Database",
            "Next.js",
            "TypeScript",
            "Tailwind CSS",
            "Recharts",
            "Framer Motion",
            "Vercel",
          ].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1.5 rounded-lg border border-border/60 bg-white/[0.03] text-xs font-mono text-text/90 hover:border-accent/40 hover:text-accent transition-colors"
            >
              {tech}
            </span>
          ))}
        </div>
      </GlassCard>

      {/* ── 9. Team & Project Credits Section (Editable via src/config/project.ts) ── */}
      <GlassCard className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-4">
          <div>
            <SectionHeader
              title="Project Team & Credits"
              icon={<Users className="h-4 w-4" />}
              className="mb-1"
            />
            <p className="text-xs text-muted">
              Configure team members and institutional details in{" "}
              <code className="text-accent font-mono text-[11px]">
                src/config/project.ts
              </code>
            </p>
          </div>

          <span className="text-xs font-mono text-muted/80 self-start sm:self-auto">
            {projectConfig.semester} {projectConfig.year}
          </span>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectConfig.team.map((member, idx) => (
            <div
              key={idx}
              className={cn(
                "p-4 rounded-xl border bg-white/[0.02] space-y-2 transition-all relative overflow-hidden",
                member.isLead
                  ? "border-accent/50 shadow-[0_0_15px_-5px_rgba(34,211,238,0.2)]"
                  : "border-border/60 hover:border-accent/30"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Avatar with beacon ping wave animation for Admin */}
                <div className="relative shrink-0">
                  {member.isLead && (
                    <div
                      className="absolute inset-0 rounded-full border border-accent/60 animate-ping pointer-events-none motion-reduce:hidden"
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={cn(
                      "relative h-10 w-10 rounded-full border flex items-center justify-center font-bold font-mono text-sm",
                      member.isLead
                        ? "bg-accent/20 border-accent/60 text-accent shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                        : "bg-accent/10 border-accent/30 text-accent"
                    )}
                  >
                    {member.name.charAt(0)}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-text truncate">
                      {member.name}
                    </h4>
                    {member.isLead && (
                      <span className="inline-flex items-center gap-1.5 shrink-0 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate">{member.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Institution / Course Note */}
        <div className="p-4 rounded-xl bg-white/[0.015] border border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted font-mono">
          <div>
            <span className="text-text font-medium block">
              {projectConfig.courseName}
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-muted">
              <span>{projectConfig.institution}</span>
              {projectConfig.instructor && (
                <>
                  <span>•</span>
                  <span className="text-accent font-semibold">Instructor: {projectConfig.instructor}</span>
                </>
              )}
            </div>
          </div>
          <Link
            href="/developer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
          >
            <span>View Developer Profile</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
