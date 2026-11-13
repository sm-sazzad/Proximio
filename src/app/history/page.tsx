"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  PieChart,
  Pie,
} from "recharts";
import { motion } from "framer-motion";
import { useLogs } from "@/hooks/useLogs";
import { useControl } from "@/hooks/useControl";
import { GlassCard } from "@/components/GlassCard";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { formatAgo } from "@/lib/utils";
import {
  History,
  Download,
  Zap,
  Timer,
  Clock,
  ChevronDown,
  Info,
  Sparkles,
  ShieldAlert,
  ArrowUpDown,
} from "lucide-react";

export default function HistoryPage() {
  const logs = useLogs();
  const { control } = useControl();

  // Filter: '24h' | 'all'
  const [filterRange, setFilterRange] = useState<"24h" | "all">("24h");

  // Pagination for event list
  const [visibleCount, setVisibleCount] = useState<number>(20);

  // Filtered log entries
  const filteredLogs = useMemo(() => {
    if (filterRange === "24h") {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return logs.filter((log) => (log.ts ?? 0) >= cutoff);
    }
    return logs;
  }, [logs, filterRange]);

  // Alert range bands from control
  const minCm = control?.minCm ?? 10;
  const maxCm = control?.maxCm ?? 50;
  const step = Math.max(1, (maxCm - minCm) / 3);
  const nearCutoff = minCm + step;
  const midCutoff = minCm + 2 * step;

  // Closeness categorization helper
  const getClosenessBand = (dist: number) => {
    if (dist <= nearCutoff) return { label: "Near", color: "#F43F5E", textColor: "text-danger", bg: "bg-danger/15" };
    if (dist <= midCutoff) return { label: "Mid", color: "#F59E0B", textColor: "text-warning", bg: "bg-warning/15" };
    return { label: "Far", color: "#22D3EE", textColor: "text-accent", bg: "bg-accent/15" };
  };

  // Stat calculations
  const totalEvents = filteredLogs.length;

  const closestEver = useMemo(() => {
    if (filteredLogs.length === 0) return null;
    return Math.min(...filteredLogs.map((l) => (l.minDistance !== undefined && l.minDistance !== null ? l.minDistance : Infinity)));
  }, [filteredLogs]);

  const avgDurationStr = useMemo(() => {
    if (filteredLogs.length === 0) return "--";
    const sum = filteredLogs.reduce((acc, l) => acc + (l.durationMs ?? 0), 0);
    const avgSec = sum / filteredLogs.length / 1000;
    return `${avgSec.toFixed(1)} s`;
  }, [filteredLogs]);

  const latestLog = filteredLogs.length > 0 ? filteredLogs[0] : null;

  // 24 Hourly Buckets for Bar Chart
  const hourlyData = useMemo(() => {
    const currentHourDate = new Date();
    currentHourDate.setMinutes(0, 0, 0);
    const currentHourMs = currentHourDate.getTime();
    const oneHourMs = 60 * 60 * 1000;

    const buckets: { hourLabel: string; count: number; isCurrentHour: boolean; timeRange: string }[] = [];

    for (let i = 23; i >= 0; i--) {
      const bucketStart = currentHourMs - i * oneHourMs;
      const bucketEnd = bucketStart + oneHourMs;
      const d = new Date(bucketStart);
      const hourLabel = d.toLocaleTimeString([], { hour: "numeric", hour12: true });

      const count = filteredLogs.filter(
        (log) => log.ts >= bucketStart && log.ts < bucketEnd
      ).length;

      buckets.push({
        hourLabel,
        count,
        isCurrentHour: i === 0,
        timeRange: `${hourLabel} – ${new Date(bucketEnd).toLocaleTimeString([], { hour: "numeric", hour12: true })}`,
      });
    }

    return buckets;
  }, [filteredLogs]);

  // Closeness Donut Data
  const closenessData = useMemo(() => {
    let nearCount = 0;
    let midCount = 0;
    let farCount = 0;

    for (const log of filteredLogs) {
      const dist = log.minDistance ?? 0;
      if (dist <= nearCutoff) nearCount++;
      else if (dist <= midCutoff) midCount++;
      else farCount++;
    }

    const total = filteredLogs.length || 1; // avoid / 0

    return [
      {
        name: "Near",
        count: nearCount,
        pct: Math.round((nearCount / total) * 100),
        color: "#F43F5E",
        range: `≤ ${Math.round(nearCutoff)}cm`,
      },
      {
        name: "Mid",
        count: midCount,
        pct: Math.round((midCount / total) * 100),
        color: "#F59E0B",
        range: `${Math.round(nearCutoff)}–${Math.round(midCutoff)}cm`,
      },
      {
        name: "Far",
        count: farCount,
        pct: Math.round((farCount / total) * 100),
        color: "#22D3EE",
        range: `> ${Math.round(midCutoff)}cm`,
      },
    ];
  }, [filteredLogs, nearCutoff, midCutoff]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ["id", "timestamp_iso", "local_time", "min_distance_cm", "duration_ms"];
    const rows = filteredLogs.map((log) => {
      const d = new Date(log.ts);
      const iso = d.toISOString();
      const local = d.toLocaleString();
      return [
        `"${String(log.id).replace(/"/g, '""')}"`,
        `"${iso}"`,
        `"${local.replace(/"/g, '""')}"`,
        log.minDistance ?? "",
        log.durationMs ?? "",
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `proximo-alert-log-${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-6">
      {/* ── Page Header & Controls ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Alarm History & Analytics</h1>
          <p className="text-sm text-muted">
            Audit log of finished proximity intrusions. Timestamps indicate when each event ended.
          </p>
        </div>

        {/* Toolbar: Filter + CSV Export */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Segmented Filter */}
          <div className="flex rounded-lg border border-border bg-white/[0.02] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setFilterRange("24h");
                setVisibleCount(20);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors min-h-[44px] sm:min-h-0 flex items-center ${
                filterRange === "24h"
                  ? "bg-accent/15 text-accent shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              Last 24 h
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterRange("all");
                setVisibleCount(20);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors min-h-[44px] sm:min-h-0 flex items-center ${
                filterRange === "all"
                  ? "bg-accent/15 text-accent shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              All loaded
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={totalEvents === 0}
            className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all min-h-[44px] ${
              totalEvents > 0
                ? "bg-white/[0.04] border-border text-text hover:bg-white/[0.08] hover:border-accent/40 active:scale-95"
                : "bg-white/[0.02] border-border/40 text-muted/50 cursor-not-allowed opacity-50"
            }`}
            aria-label="Export filtered alarms to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 100 Events Notice */}
      {logs.length >= 100 && (
        <div className="flex items-center gap-2 text-xs text-muted font-mono bg-white/[0.02] border border-border/40 rounded-lg px-3 py-1.5">
          <Info className="h-3.5 w-3.5 text-accent shrink-0" />
          <span>Showing the latest 100 events from Firebase storage buffer.</span>
        </div>
      )}

      {/* ── Stat Cards Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <GlassCard hover className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-2">
            <History className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Events</span>
          </div>
          <p className="text-3xl font-extrabold text-text tracking-tight my-1">
            {totalEvents}
          </p>
          <p className="text-[11px] text-muted">
            {filterRange === "24h" ? "In the last 24 hours" : "All loaded events"}
          </p>
        </GlassCard>

        {/* Closest Ever */}
        <GlassCard hover className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-2">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider">Closest Breach</span>
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-extrabold text-text tracking-tight">
              {closestEver !== null && closestEver !== Infinity ? closestEver : "--"}
            </span>
            {closestEver !== null && closestEver !== Infinity && (
              <span className="text-sm font-semibold text-muted">cm</span>
            )}
          </div>
          <p className="text-[11px] text-muted">Maximum intruder proximity</p>
        </GlassCard>

        {/* Average Duration */}
        <GlassCard hover className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-2">
            <Timer className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Duration</span>
          </div>
          <p className="text-3xl font-extrabold text-accent tracking-tight my-1">
            {avgDurationStr}
          </p>
          <p className="text-[11px] text-muted">Time target remained in range</p>
        </GlassCard>

        {/* Last Event */}
        <GlassCard hover className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted mb-2">
            <Clock className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider">Last Event</span>
          </div>
          <p className="text-lg font-bold text-text my-1 truncate">
            {latestLog ? formatAgo(Math.max(0, Math.floor((Date.now() - latestLog.ts) / 1000))) : "--"}
          </p>
          <p className="text-[11px] text-muted truncate">
            {latestLog ? new Date(latestLog.ts).toLocaleTimeString() : "No events recorded"}
          </p>
        </GlassCard>
      </div>

      {/* ── Empty State If No Events ─────────────────────────────────── */}
      {totalEvents === 0 ? (
        <GlassCard className="p-12">
          <EmptyState
            title="No alarm events recorded yet"
            description="When an object enters the alert range and leaves, the ESP32 logs the event here upon completion."
            icon={<ShieldAlert className="h-10 w-10 text-muted" />}
          />
        </GlassCard>
      ) : (
        <>
          {/* ── Charts Bento Grid: Hourly Frequency & Closeness Donut ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 1) Bar Chart: Alerts Per Hour (7 cols) */}
            <GlassCard hover className="lg:col-span-7 p-6 space-y-4 flex flex-col justify-between">
              <div>
                <SectionHeader
                  title="Alerts Per Hour (Last 24h)"
                  icon={<Clock className="h-4 w-4" />}
                  className="mb-1"
                />
                <p className="text-xs text-muted">
                  Hourly distribution of proximity triggers. Current hour highlighted in cyan.
                </p>
              </div>

              <div className="h-56 sm:h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="hourLabel"
                      stroke="#8A97AD"
                      tick={{ fill: "#8A97AD", fontSize: 9 }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                      interval={3}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="#8A97AD"
                      tick={{ fill: "#8A97AD", fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const item = payload[0].payload as {
                          hourLabel: string;
                          count: number;
                          isCurrentHour: boolean;
                          timeRange: string;
                        };
                        return (
                          <div className="rounded-lg border border-border bg-card/95 p-2.5 shadow-xl backdrop-blur-md text-xs font-mono space-y-1">
                            <p className="text-muted text-[11px]">{item.timeRange}</p>
                            <p className="font-bold text-accent">
                              {item.count} {item.count === 1 ? "alarm event" : "alarm events"}
                            </p>
                            {item.isCurrentHour && (
                              <p className="text-[10px] text-cyan-400 font-semibold">Current Hour</p>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                      {hourlyData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isCurrentHour ? "#22D3EE" : "rgba(34, 211, 238, 0.4)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted font-mono">
                <span>Total 24h: {hourlyData.reduce((acc, b) => acc + b.count, 0)} events</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <span>Current hour</span>
                </span>
              </div>
            </GlassCard>

            {/* 2) Donut Chart: Events By Closeness (5 cols) */}
            <GlassCard hover className="lg:col-span-5 p-6 space-y-4 flex flex-col justify-between">
              <div>
                <SectionHeader
                  title="Events by Closeness"
                  icon={<Zap className="h-4 w-4" />}
                  className="mb-1"
                />
                <p className="text-xs text-muted">
                  Partitioned into Near, Mid, and Far bands based on current alert range ({minCm}–{maxCm}cm).
                </p>
              </div>

              {/* Donut with Total in Center */}
              <div className="relative h-48 sm:h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload as {
                          name: string;
                          count: number;
                          pct: number;
                          color: string;
                          range: string;
                        };
                        return (
                          <div className="rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur-md text-xs font-mono space-y-0.5">
                            <span className="font-bold block" style={{ color: d.color }}>
                              {d.name} Zone ({d.range})
                            </span>
                            <span className="text-text">
                              {d.count} events ({d.pct}%)
                            </span>
                          </div>
                        );
                      }}
                    />
                    <Pie
                      data={closenessData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={3}
                      stroke="rgba(0,0,0,0.5)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {closenessData.map((entry, index) => (
                        <Cell key={`donut-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-text tracking-tight">
                    {totalEvents}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-muted">
                    Total
                  </span>
                </div>
              </div>

              {/* Closeness Legend with Counts & Percentages */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-xs">
                {closenessData.map((item) => (
                  <div key={item.name} className="flex flex-col items-center p-2 rounded-lg bg-white/[0.02] border border-border/30">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-text">{item.name}</span>
                    </div>
                    <span className="font-bold font-mono text-sm" style={{ color: item.color }}>
                      {item.count}
                    </span>
                    <span className="text-[10px] text-muted">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* ── Event Timeline & Detailed Log List ──────────────────────── */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <SectionHeader
                  title="Event Timeline & Audit Log"
                  icon={<History className="h-4 w-4" />}
                  className="mb-1"
                />
                <p className="text-xs text-muted">
                  Detailed reverse-chronological list of verified intrusions.
                </p>
              </div>
              <span className="text-xs font-mono text-muted self-start sm:self-auto">
                Showing {Math.min(visibleCount, filteredLogs.length)} of {filteredLogs.length} events
              </span>
            </div>

            {/* List / Timeline rows */}
            <div className="divide-y divide-border/40 pt-2">
              {filteredLogs.slice(0, visibleCount).map((log, index) => {
                const dateObj = new Date(log.ts);
                const closeness = getClosenessBand(log.minDistance ?? 0);
                const secondsAgo = Math.max(0, Math.floor((Date.now() - log.ts) / 1000));

                return (
                  <motion.div
                    key={log.id || `log-${index}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
                  >
                    {/* Left: Date, Time & Relative Age */}
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/[0.03] border border-border/50 flex items-center justify-center text-muted shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text">
                            {dateObj.toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                            , {dateObj.toLocaleTimeString()}
                          </span>
                          <span className="text-muted text-[11px]">
                            ({formatAgo(secondsAgo)})
                          </span>
                        </div>
                        <span className="text-[10px] text-muted font-mono block">
                          ID: {log.id}
                        </span>
                      </div>
                    </div>

                    {/* Right: Distance, Closeness Pill & Duration */}
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      {/* Distance & Closeness Indicator */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-text">
                          {log.minDistance ?? "--"} cm
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${closeness.bg} ${closeness.textColor}`}
                        >
                          {closeness.label}
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-muted text-[11px] block">Duration</span>
                        <span className="font-mono text-xs font-semibold text-text">
                          {log.durationMs !== undefined && log.durationMs !== null
                            ? log.durationMs >= 1000
                              ? `${(log.durationMs / 1000).toFixed(1)}s`
                              : `${log.durationMs}ms`
                            : "--"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* "Show More" Button */}
            {visibleCount < filteredLogs.length && (
              <div className="pt-3 flex justify-center border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 20)}
                  className="min-h-[44px] px-6 py-2 rounded-lg border border-border text-xs font-semibold text-text hover:bg-white/[0.04] hover:border-accent/40 transition-colors flex items-center gap-2"
                >
                  <ChevronDown className="h-4 w-4" />
                  <span>Show 20 More Events</span>
                </button>
              </div>
            )}
          </GlassCard>
        </>
      )}
    </div>
  );
}
