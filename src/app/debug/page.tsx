"use client";

import { useLive } from "@/hooks/useLive";
import { useControl } from "@/hooks/useControl";
import { useLogs } from "@/hooks/useLogs";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { GlassCard } from "@/components/GlassCard";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusPill } from "@/components/StatusPill";
import { formatAgo } from "@/lib/utils";

export default function DebugPage() {
  const live = useLive();
  const { control } = useControl();
  const logs = useLogs();
  const { online, secondsAgo } = useDeviceStatus();

  return (
    <main className="max-w-2xl mx-auto space-y-6">
      <SectionHeader title="Proximo — Firebase Debug Panel" />

      {/* Online / Offline indicator */}
      <GlassCard className="flex items-center gap-3">
        <span
          className={`inline-block w-3 h-3 rounded-full ${
            online ? "bg-success shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-danger shadow-[0_0_8px_rgba(244,63,94,0.6)]"
          }`}
          aria-label={online ? "Device is online" : "Device is offline"}
        />
        <span className="text-base font-medium text-text">
          {online ? "Device Online" : "Device Offline"}
        </span>
        {secondsAgo !== null && (
          <span className="text-muted text-sm ml-auto">
            last ping {formatAgo(secondsAgo)}
          </span>
        )}
      </GlassCard>

      {/* Live data */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">/live</h2>
          {live?.status && <StatusPill status={live.status} />}
        </div>
        {live ? (
          <div className="space-y-2 font-mono text-xs">
            <Row label="distance" value={`${live.distance} cm`} />
            <Row label="status" value={live.status} />
            <Row label="rssi" value={`${live.rssi} dBm`} />
            <Row label="uptime" value={`${live.uptime} s`} />
            <Row label="events" value={String(live.events)} />
            <Row label="lastEventMin" value={`${live.lastEventMin} cm`} />
            <Row label="ts" value={String(live.ts)} />
          </div>
        ) : (
          <p className="text-muted text-sm">Waiting for live data...</p>
        )}
      </GlassCard>

      {/* Control data */}
      <GlassCard>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">/control</h2>
        {control ? (
          <div className="space-y-2 font-mono text-xs">
            <Row label="minCm" value={`${control.minCm} cm`} />
            <Row label="maxCm" value={`${control.maxCm} cm`} />
            <Row label="buzzerEnabled" value={String(control.buzzerEnabled)} />
            <Row label="armed" value={String(control.armed)} />
          </div>
        ) : (
          <p className="text-muted text-sm">Waiting for control data...</p>
        )}
      </GlassCard>

      {/* Logs count */}
      <GlassCard>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">/logs</h2>
        <div className="flex justify-between font-mono text-xs">
          <span className="text-muted">Total loaded entries:</span>
          <span className="text-accent font-bold">{logs.length}</span>
        </div>
      </GlassCard>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-border/40 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-text font-semibold">{value}</span>
    </div>
  );
}

