"use client";

import { useLogs } from "@/hooks/useLogs";
import { GlassCard } from "@/components/GlassCard";
import { StatCard } from "@/components/StatCard";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { History, ListOrdered, Sparkles, Timer, Zap } from "lucide-react";

export default function HistoryPage() {
  const logs = useLogs();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Event History</h1>
        <p className="text-sm text-muted">Historical records of finished proximity alerts</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Logged"
          value={String(logs.length)}
          icon={<History className="h-4 w-4" />}
          subtitle="Events recorded"
        />
        <StatCard
          label="Closest Breach"
          value={logs.length > 0 ? `${Math.min(...logs.map((l) => l.minDistance))} cm` : "--"}
          icon={<Zap className="h-4 w-4" />}
          subtitle="All-time closest"
        />
        <StatCard
          label="Avg Duration"
          value={
            logs.length > 0
              ? `${Math.round(logs.reduce((acc, l) => acc + l.durationMs, 0) / logs.length)} ms`
              : "--"
          }
          icon={<Timer className="h-4 w-4" />}
          subtitle="Average time in zone"
        />
        <StatCard
          label="Buffer Status"
          value="Active"
          icon={<ListOrdered className="h-4 w-4" />}
          subtitle="Latest 100 entries"
        />
      </div>

      {/* Step 6 Placeholder */}
      <GlassCard hover className="p-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/30 shadow-[0_0_25px_rgba(34,211,238,0.2)]">
            <History className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent ring-1 ring-inset ring-accent/20">
              Coming in Step 6
            </span>
            <h2 className="text-xl font-semibold text-text">Analytics & Detailed Log Timeline</h2>
            <p className="text-sm text-muted max-w-xl">
              Time-stamped audit log, frequency distribution charts, proximity grouping, and single-click CSV data export.
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <SectionHeader title="Recent Alarm Timeline" />
        {logs.length === 0 ? (
          <EmptyState
            title="No alarm events recorded yet"
            description="When an object enters the trigger zone, the ESP32 logs the event here upon exit."
            icon={<Sparkles className="h-8 w-8 text-muted" />}
          />
        ) : (
          <div className="divide-y divide-border/40 font-mono text-xs">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-text font-semibold">{log.minDistance} cm</span>
                  <span className="text-muted ml-2">duration {log.durationMs}ms</span>
                </div>
                <span className="text-muted">
                  {new Date(log.ts).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

