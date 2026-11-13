"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import { useDistanceBuffer, type DistanceSample } from "@/hooks/useDistanceBuffer";
import { useControl } from "@/hooks/useControl";
import { useServerTimeOffset } from "@/hooks/useServerTimeOffset";
import { GlassCard } from "@/components/GlassCard";
import { Play, Pause, Activity, Clock } from "lucide-react";

/** Window options in milliseconds */
const WINDOW_OPTIONS = [
  { label: "1 min", value: 60 * 1000 },
  { label: "5 min", value: 5 * 60 * 1000 },
] as const;

export function LiveChart() {
  const samples = useDistanceBuffer();
  const { control } = useControl();
  const offset = useServerTimeOffset();

  // Selected time window (default 1 min)
  const [windowMs, setWindowMs] = useState<number>(60 * 1000);

  // Pause / Resume state
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [frozenNow, setFrozenNow] = useState<number | null>(null);

  // Live ticking timeline: advances every 1s
  const [currentNow, setCurrentNow] = useState<number>(() => Date.now() + offset);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentNow(Date.now() + offset);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, offset]);

  // Handle Pause / Resume toggle
  const togglePause = () => {
    if (!isPaused) {
      setFrozenNow(currentNow);
      setIsPaused(true);
    } else {
      setIsPaused(false);
      setFrozenNow(null);
      setCurrentNow(Date.now() + offset);
    }
  };

  // Effective viewing timeline
  const effectiveNow = isPaused && frozenNow !== null ? frozenNow : currentNow;
  const windowStart = effectiveNow - windowMs;

  // Visible samples in current window
  const visibleSamples = useMemo(() => {
    return samples.filter(
      (s) => s.timestamp >= windowStart - 2000 && s.timestamp <= effectiveNow + 2000
    );
  }, [samples, windowStart, effectiveNow]);

  // Alert range from control
  const minCm = control?.minCm ?? 10;
  const maxCm = control?.maxCm ?? 50;

  // Y-axis max scale (at least 100cm, step of 50cm, never above 400cm)
  const yMax = useMemo(() => {
    const target = Math.max(maxCm * 1.25, 100);
    return Math.min(400, Math.ceil(target / 50) * 50);
  }, [maxCm]);

  // Calculate statistics for the visible window
  const stats = useMemo(() => {
    const valid = visibleSamples
      .map((s) => s.distance)
      .filter((d): d is number => d !== null);

    if (valid.length === 0) {
      return { min: null, max: null, avg: null, count: 0 };
    }

    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const sum = valid.reduce((acc, v) => acc + v, 0);
    const avg = Math.round(sum / valid.length);

    return { min, max, avg, count: valid.length };
  }, [visibleSamples]);

  // Format tick times: mm:ss
  const formatTimeTick = (ms: number) => {
    const d = new Date(ms);
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${m}:${s}`;
  };

  // Format tooltip times: HH:mm:ss
  const formatTooltipTime = (ms: number) => {
    const d = new Date(ms);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <GlassCard hover className="p-5 md:p-6 space-y-4">
      {/* ── Header Toolbar ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text">
            Live Distance Stream
          </h3>
          {isPaused ? (
            <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-[11px] font-semibold text-warning border border-warning/30">
              <Pause className="h-3 w-3" />
              Paused
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-semibold text-success border border-success/30">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Streaming
            </span>
          )}
        </div>

        {/* Toolbar Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={togglePause}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
              isPaused
                ? "bg-accent text-bg border-accent font-semibold hover:bg-accent/90"
                : "bg-white/[0.04] text-muted border-border hover:text-text hover:bg-white/[0.08]"
            }`}
            aria-label={isPaused ? "Resume live streaming" : "Pause live streaming"}
          >
            {isPaused ? (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>Pause</span>
              </>
            )}
          </button>

          {/* Window Duration Selector */}
          <div className="flex rounded-lg border border-border bg-white/[0.02] p-0.5 text-xs">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setWindowMs(opt.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  windowMs === opt.value
                    ? "bg-accent/15 text-accent font-semibold shadow-sm"
                    : "text-muted hover:text-text"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat Chips ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted text-[11px] flex items-center gap-1 mr-1">
          <Clock className="h-3 w-3" /> Window Stats:
        </span>
        <span className="rounded-md bg-white/[0.03] border border-border/50 px-2.5 py-1 text-muted">
          Min: <strong className="text-text font-mono">{stats.min !== null ? `${stats.min} cm` : "--"}</strong>
        </span>
        <span className="rounded-md bg-white/[0.03] border border-border/50 px-2.5 py-1 text-muted">
          Max: <strong className="text-text font-mono">{stats.max !== null ? `${stats.max} cm` : "--"}</strong>
        </span>
        <span className="rounded-md bg-white/[0.03] border border-border/50 px-2.5 py-1 text-muted">
          Avg: <strong className="text-accent font-mono">{stats.avg !== null ? `${stats.avg} cm` : "--"}</strong>
        </span>
        <span className="rounded-md bg-white/[0.03] border border-border/50 px-2.5 py-1 text-muted hidden sm:inline-block">
          Samples: <strong className="text-text font-mono">{stats.count}</strong>
        </span>
      </div>

      {/* ── Chart Area ───────────────────────────────────────────────── */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {samples.length === 0 ? (
          <div className="h-full w-full rounded-lg border border-dashed border-border/60 flex flex-col items-center justify-center text-center p-4">
            <span className="inline-block h-2 w-2 rounded-full bg-accent animate-ping mb-2" />
            <p className="text-sm font-medium text-text">Waiting for telemetry data...</p>
            <p className="text-xs text-muted max-w-xs mt-1">
              Readings will appear automatically as the ESP32 logs distance measurements.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={visibleSamples}
              margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient id="distance-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              {/* Faint Grid */}
              <CartesianGrid
                stroke="rgba(255,255,255,0.04)"
                strokeDasharray="3 3"
                vertical={false}
              />

              {/* Dynamic Scrolling Time Axis */}
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={[windowStart, effectiveNow]}
                tickFormatter={formatTimeTick}
                stroke="#8A97AD"
                tick={{ fill: "#8A97AD", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                minTickGap={45}
              />

              {/* Distance Axis */}
              <YAxis
                domain={[0, yMax]}
                stroke="#8A97AD"
                tick={{ fill: "#8A97AD", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickFormatter={(v: number) => `${v}cm`}
              />

              {/* Dark Glass Tooltip */}
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload as DistanceSample;
                  const isSampleAlert =
                    data.distance !== null &&
                    data.distance >= minCm &&
                    data.distance <= maxCm;

                  return (
                    <div className="rounded-lg border border-border bg-card/95 p-2.5 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1 z-50">
                      <div className="text-[11px] text-muted flex justify-between gap-3">
                        <span>Time:</span>
                        <span className="text-text">{formatTooltipTime(data.timestamp)}</span>
                      </div>
                      <div className="flex justify-between gap-3 font-semibold">
                        <span className="text-muted">Distance:</span>
                        <span className={isSampleAlert ? "text-danger" : "text-accent"}>
                          {data.distance !== null ? `${data.distance} cm` : "No echo (gap)"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 text-[10px]">
                        <span className="text-muted">Status:</span>
                        <span
                          className={`uppercase font-bold ${
                            data.status === "alert"
                              ? "text-danger"
                              : data.status === "safe"
                              ? "text-success"
                              : "text-warning"
                          }`}
                        >
                          {data.status}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />

              {/* Shaded Alert Band */}
              {maxCm > minCm && (
                <ReferenceArea
                  y1={minCm}
                  y2={maxCm}
                  fill="rgba(244,63,94,0.08)"
                  stroke="rgba(244,63,94,0.25)"
                  strokeDasharray="4 2"
                />
              )}

              {/* Reference Lines for Min & Max Alert Thresholds */}
              <ReferenceLine
                y={minCm}
                stroke="#F43F5E"
                strokeDasharray="4 4"
                strokeOpacity={0.65}
                label={{
                  value: `Min ${minCm}cm`,
                  position: "insideBottomLeft",
                  fill: "#F43F5E",
                  fontSize: 9,
                  opacity: 0.85,
                }}
              />
              <ReferenceLine
                y={maxCm}
                stroke="#F43F5E"
                strokeDasharray="4 4"
                strokeOpacity={0.65}
                label={{
                  value: `Max ${maxCm}cm`,
                  position: "insideTopLeft",
                  fill: "#F43F5E",
                  fontSize: 9,
                  opacity: 0.85,
                }}
              />

              {/* Cyan Distance Stream Area */}
              <Area
                type="monotone"
                dataKey="distance"
                stroke="#22D3EE"
                strokeWidth={1.8}
                fill="url(#distance-chart-gradient)"
                connectNulls={false}
                isAnimationActive={false}
                dot={(props: unknown) => {
                  const { cx, cy, payload } = (props ?? {}) as {
                    cx?: number;
                    cy?: number;
                    payload?: DistanceSample;
                  };
                  if (
                    cx === undefined ||
                    cy === undefined ||
                    !payload ||
                    payload.distance === null ||
                    payload.distance < minCm ||
                    payload.distance > maxCm
                  ) {
                    return <g key={`${cx}-${cy}`} />;
                  }
                  return (
                    <circle
                      key={`${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={2.5}
                      fill="#F43F5E"
                      stroke="#FFFFFF"
                      strokeWidth={0.8}
                    />
                  );
                }}
                activeDot={{
                  r: 4.5,
                  fill: "#22D3EE",
                  stroke: "#FFFFFF",
                  strokeWidth: 1.5,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Footer / Legend ──────────────────────────────────────────── */}
      <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span>Live Distance</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-danger" />
            <span>Alert Dot (&le;{maxCm}cm)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-danger/20 border border-danger/40" />
            <span>Alert Range</span>
          </span>
        </div>
        <span>Rolling buffer (max 5m)</span>
      </div>
    </GlassCard>
  );
}
