"use client";

import { useLive } from "@/hooks/useLive";
import { useControl } from "@/hooks/useControl";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { GlassCard } from "@/components/GlassCard";
import { RadarGauge } from "@/components/RadarGauge";
import { NumberTicker } from "@/components/NumberTicker";
import { WifiSignal } from "@/components/WifiSignal";
import { Skeleton } from "@/components/Skeleton";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ShieldOff,
  Radio,
  Clock,
  Volume2,
  VolumeX,
  WifiOff,
  Zap,
  Info,
} from "lucide-react";

/** Format seconds into human readable uptime (e.g. "2h 14m", "45s") */
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const remSeconds = seconds % 60;
    return remSeconds > 0 ? `${minutes}m ${remSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
}

export default function DashboardPage() {
  const live = useLive();
  const { control } = useControl();
  const { online, secondsAgo } = useDeviceStatus();

  // If live data has not loaded at all yet, display matched layout skeletons
  if (!live) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Skeleton className="lg:col-span-5 h-64 rounded-xl" />
          <Skeleton className="lg:col-span-7 h-64 rounded-xl" />
          <Skeleton className="lg:col-span-7 h-80 rounded-xl" />
          <Skeleton className="lg:col-span-5 h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const isAlert = live.status === "alert";
  const isNoSensor = live.status === "nosensor";
  const isDisarmed = live.status === "disarmed";
  const isSafe = live.status === "safe";

  const minCm = control?.minCm ?? 10;
  const maxCm = control?.maxCm ?? 50;
  const buzzerEnabled = control?.buzzerEnabled ?? true;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-4">
      {/* ── Eye-catching Alert Banner (When In Alert State) ───────────────── */}
      {isAlert && (
        <div
          className="rounded-xl border border-danger/60 bg-danger/15 p-4 text-danger shadow-[0_0_35px_rgba(244,63,94,0.35)] flex items-center justify-between gap-4 animate-pulse"
          role="alert"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger/20 text-danger">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base tracking-wide uppercase">
                Proximity Breach Triggered
              </p>
              <p className="text-xs text-danger/80">
                Object detected at <strong className="text-white">{live.distance} cm</strong> within trigger range ({minCm}–{maxCm} cm).
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-danger px-3 py-1 text-xs font-bold text-white shadow-sm">
            ACTIVE ALARM
          </span>
        </div>
      )}

      {/* ── Persistent Device Offline Banner (When Disconnected) ───────────── */}
      {!online && (
        <div
          className="rounded-xl border border-warning/40 bg-warning/10 p-3.5 text-warning flex items-center gap-3 text-xs sm:text-sm"
          role="status"
        >
          <WifiOff className="h-5 w-5 shrink-0 text-warning" />
          <p>
            <strong>Device Offline:</strong> Showing last cached telemetry. Last ping received{" "}
            {secondsAgo !== null ? `${secondsAgo}s ago` : "recently"}.
          </p>
        </div>
      )}

      {/* ── Bento-Style Dashboard Grid ────────────────────────────────────── */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-5 transition-opacity duration-300 ${
          !online ? "opacity-85" : "opacity-100"
        }`}
      >
        {/* 1) Hero Distance Card (Mobile Stack First, Desktop Left) */}
        <GlassCard
          hover
          className={`lg:col-span-5 flex flex-col justify-between p-6 relative overflow-hidden ${
            isAlert ? "border-danger/40 shadow-[0_0_25px_rgba(244,63,94,0.15)]" : ""
          }`}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-20 blur-2xl"
            style={{
              backgroundColor: isAlert ? "#F43F5E" : "#22D3EE",
            }}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className={`h-4 w-4 ${isAlert ? "text-danger" : "text-accent"}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Live Proximity
              </span>
            </div>
            {secondsAgo !== null && (
              <span className="text-[11px] font-mono text-muted">
                updated {secondsAgo}s ago
              </span>
            )}
          </div>

          {/* Very Large Distance Number Ticker */}
          <div className="my-6">
            {live.distance === -1 ? (
              <div className="flex flex-col">
                <span className="text-6xl sm:text-7xl font-extrabold tracking-tight text-muted">
                  --
                </span>
                <span className="text-sm font-medium text-muted mt-1">
                  No echo / clear path
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <NumberTicker
                  value={live.distance}
                  decimalPlaces={1}
                  className={`text-6xl sm:text-7xl font-extrabold tracking-tight ${
                    isAlert ? "text-danger drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" : "text-text"
                  }`}
                />
                <span className="text-2xl sm:text-3xl font-semibold text-muted">
                  cm
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted">
            <span>Range target</span>
            <span className="font-mono text-text">
              {minCm} cm &mdash; {maxCm} cm
            </span>
          </div>
        </GlassCard>

        {/* 2) Status Card (4 States) */}
        <GlassCard
          hover
          className={`lg:col-span-7 flex flex-col justify-between p-6 ${
            isAlert ? "border-danger/40 bg-danger/[0.04]" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Monitoring Status
            </span>
            {/* Buzzer Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                buzzerEnabled
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "bg-white/5 text-muted border border-border"
              }`}
            >
              {buzzerEnabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Buzzer Armed</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5" />
                  <span>Buzzer Muted</span>
                </>
              )}
            </div>
          </div>

          {/* State Specific Display */}
          <div className="my-5 flex items-center gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                isAlert
                  ? "bg-danger/20 text-danger shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse"
                  : isSafe
                  ? "bg-success/15 text-success shadow-[0_0_15px_rgba(52,211,153,0.2)]"
                  : isNoSensor
                  ? "bg-warning/15 text-warning shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "bg-muted/15 text-muted"
              }`}
            >
              {isAlert && <ShieldAlert className="h-7 w-7" />}
              {isSafe && <ShieldCheck className="h-7 w-7" />}
              {isNoSensor && <AlertTriangle className="h-7 w-7" />}
              {isDisarmed && <ShieldOff className="h-7 w-7" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    isAlert
                      ? "bg-danger animate-ping"
                      : isSafe
                      ? "bg-success"
                      : isNoSensor
                      ? "bg-warning"
                      : "bg-muted"
                  }`}
                />
                <h2 className="text-xl font-bold tracking-tight text-text">
                  {isAlert && "ALERT: PROXIMITY BREACH"}
                  {isSafe && "SECURE: ALL CLEAR"}
                  {isNoSensor && "WARNING: SENSOR FAULT"}
                  {isDisarmed && "STANDBY: DISARMED"}
                </h2>
              </div>
              <p className="text-xs text-muted mt-1">
                {isAlert && `Object is within active alert bounds (${minCm} cm to ${maxCm} cm).`}
                {isSafe && `Target is outside alert bounds (${minCm} cm to ${maxCm} cm).`}
                {isNoSensor && "Ultrasonic sensor disconnected or returning echo timeout."}
                {isDisarmed && "System monitoring is currently paused from controls."}
              </p>
            </div>
          </div>

          {/* Control Alert Range Details */}
          <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted">
              Alert range: <strong className="text-text font-mono">{minCm} to {maxCm} cm</strong>
            </span>
            <span className="text-muted">
              Threshold delta: <strong className="text-accent font-mono">{maxCm - minCm} cm</strong>
            </span>
          </div>
        </GlassCard>

        {/* 3) Radar Gauge (The Centerpiece — Large Bento Card) */}
        <GlassCard
          hover
          className="lg:col-span-7 flex flex-col justify-between p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text">
                180° Sonar Radar
              </h3>
            </div>
            <span className="text-xs font-mono text-muted">
              {live.distance > 0 ? `${live.distance} cm` : "Scanning"}
            </span>
          </div>

          {/* Radar SVG Visualizer */}
          <RadarGauge live={live} control={control} className="my-2" />

          <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-danger/50 border border-danger/80" />
              <span>Alert Arc: {minCm}–{maxCm} cm</span>
            </span>
            <span>Sweep: 4.0s cycle</span>
          </div>
        </GlassCard>

        {/* 4) Device & Event Metrics Column */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
          {/* Device Card */}
          <GlassCard hover className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Device Telemetry
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    online ? "bg-success" : "bg-danger"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    online ? "text-success" : "text-danger"
                  }`}
                >
                  {online ? "Connected" : "Offline"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-2">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-border/40">
                <span className="text-[11px] text-muted block mb-1">WiFi RSSI</span>
                <WifiSignal rssi={live.rssi} />
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-border/40">
                <span className="text-[11px] text-muted block mb-1">System Uptime</span>
                <div className="flex items-center gap-1.5 text-text font-bold text-sm">
                  <Clock className="h-3.5 w-3.5 text-accent" />
                  <span>{formatUptime(live.uptime)}</span>
                </div>
                <span className="text-[10px] text-muted block mt-0.5">
                  Boot sec: {live.uptime}s
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-muted flex justify-between">
              <span>ESP32 Node</span>
              <span className="font-mono text-text">asia-southeast1</span>
            </div>
          </GlassCard>

          {/* Event Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Alerts Since Boot Card */}
            <GlassCard hover className="p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted mb-1">
                <span className="text-[11px] font-medium">Alerts Count</span>
                <div title="Counter resets when the ESP32 reboots" className="cursor-help">
                  <Info className="h-3.5 w-3.5 text-muted hover:text-accent transition-colors" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-text tracking-tight my-1">
                {live.events}
              </p>
              <p className="text-[10px] text-muted">Resets on reboot</p>
            </GlassCard>

            {/* Closest Approach Card */}
            <GlassCard hover className="p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted mb-1">
                <span className="text-[11px] font-medium">Closest Event</span>
                <Zap className="h-3.5 w-3.5 text-accent" />
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-3xl font-extrabold text-text tracking-tight">
                  {live.events > 0 && live.lastEventMin > 0 ? live.lastEventMin : "--"}
                </span>
                {live.events > 0 && live.lastEventMin > 0 && (
                  <span className="text-xs font-semibold text-muted">cm</span>
                )}
              </div>
              <p className="text-[10px] text-muted">Closest intrusion</p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
