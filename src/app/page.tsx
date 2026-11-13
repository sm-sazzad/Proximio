"use client";

import { useLive } from "@/hooks/useLive";
import { GlassCard } from "@/components/GlassCard";
import { StatCard } from "@/components/StatCard";
import { StatusPill } from "@/components/StatusPill";
import { SectionHeader } from "@/components/SectionHeader";
import { Skeleton } from "@/components/Skeleton";
import { Activity, Radio, ShieldAlert, Clock, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const live = useLive();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Live Dashboard</h1>
          <p className="text-sm text-muted">Real-time telemetry and proximity tracking</p>
        </div>
        <div>
          {live ? (
            <StatusPill status={live.status} />
          ) : (
            <Skeleton className="h-6 w-20 rounded-full" />
          )}
        </div>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {live ? (
          <>
            <StatCard
              label="Distance"
              value={live.distance === -1 ? "--" : `${live.distance} cm`}
              icon={<Radio className="h-4 w-4" />}
              subtitle={live.distance === -1 ? "No echo / sensor clear" : "Active ultrasonic reading"}
            />
            <StatCard
              label="WiFi Signal"
              value={`${live.rssi} dBm`}
              icon={<Activity className="h-4 w-4" />}
              subtitle="Signal strength to AP"
            />
            <StatCard
              label="Uptime"
              value={`${Math.floor(live.uptime / 60)}m ${live.uptime % 60}s`}
              icon={<Clock className="h-4 w-4" />}
              subtitle="Seconds since boot"
            />
            <StatCard
              label="Alarm Events"
              value={String(live.events)}
              icon={<ShieldAlert className="h-4 w-4" />}
              subtitle={`Closest: ${live.lastEventMin} cm`}
            />
          </>
        ) : (
          <>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </>
        )}
      </div>

      {/* Step 3 Placeholder Card */}
      <GlassCard hover className="relative overflow-hidden border-accent/20 p-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/30 shadow-[0_0_25px_rgba(34,211,238,0.2)]">
            <Sparkles className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent ring-1 ring-inset ring-accent/20">
              Coming in Step 3
            </span>
            <h2 className="text-xl font-semibold text-text">Radar Gauge & Animated Number Ticker</h2>
            <p className="text-sm text-muted max-w-xl">
              An interactive SVG sweeping radar displaying proximity arcs, smooth blip tracking, and instant color transitions during alert events.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Step 4 Chart Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-6 space-y-3">
          <SectionHeader title="Live Stream Trends" />
          <p className="text-xs text-muted">
            Rolling 5-minute distance buffer with dynamic alert thresholds.
          </p>
          <div className="h-32 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted">
            Chart View (Step 4)
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-3">
          <SectionHeader title="Proximity Zones" />
          <p className="text-xs text-muted">
            Dynamic zone safety categorization (Danger, Caution, Safe).
          </p>
          <div className="h-32 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted">
            Zone Diagnostics (Step 7)
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
