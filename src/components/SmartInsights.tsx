"use client";

import { useLive } from "@/hooks/useLive";
import { useControl } from "@/hooks/useControl";
import { useMotionInsights } from "@/hooks/useMotionInsights";
import { GlassCard } from "@/components/GlassCard";
import { SectionHeader } from "@/components/SectionHeader";
import { Skeleton } from "@/components/Skeleton";
import {
  Activity,
  Timer,
  ShieldAlert,
  ArrowDown,
  ArrowUp,
  Minus,
  HelpCircle,
  Info,
  Radio,
  AlertTriangle,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Smart Insights component:
 * 1) Motion Card: Direction with animated arrow, 10s regression window, 4s hold with dimmed indicator,
 *    and seamless placeholder state inside the same card (No echo / Device offline / Disarmed / Not enough data yet).
 * 2) Prediction Card: Time-to-contact estimates aligned strictly with firmware alert zone [minCm, maxCm].
 * 3) Zone Card: Segmented bar with below-range grey segment, Danger, Caution, Clear, and distance pin marker.
 */
export function SmartInsights() {
  const live = useLive();
  const { control } = useControl();
  const {
    direction,
    speedCmS,
    confidence,
    sampleCount,
    isHolding,
    placeholderReason,
  } = useMotionInsights();
  const prefersReducedMotion = useReducedMotion();

  // If live data has not loaded at all yet, show matched skeleton
  if (!live) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-36 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    );
  }

  const minCm = control?.minCm ?? 10;
  const maxCm = control?.maxCm ?? 50;
  const distance = live.distance;
  const isNoEcho = distance === -1;
  const isDisarmed = live.status === "disarmed";

  // Alert range calculations (strictly [minCm, maxCm])
  // Split into 3 equal bands: nearest third = Danger, other two thirds = Caution
  const alertSpan = Math.max(1, maxCm - minCm);
  const dangerThreshold = minCm + alertSpan / 3;

  // Determine current proximity zone matching firmware contract
  let zoneState: "danger" | "caution" | "clear" | "below" | "disarmed" | "noecho" = "clear";
  let zoneLabel = "Clear Zone";
  let zoneDescription = "Outside alert range";

  if (isDisarmed) {
    zoneState = "disarmed";
    zoneLabel = "Not monitoring";
    zoneDescription = "Sensor disarmed";
  } else if (isNoEcho) {
    zoneState = "noecho";
    zoneLabel = "No reading";
    zoneDescription = "No ultrasonic echo";
  } else if (distance < minCm) {
    // Distance below alert range (firmware does not trigger alarm)
    zoneState = "below";
    zoneLabel = "Below alert range";
    zoneDescription = `Below alert range (under ${minCm} cm)`;
  } else if (distance > maxCm) {
    zoneState = "clear";
    zoneLabel = "Clear Zone";
    zoneDescription = `Beyond alert boundary (> ${maxCm} cm)`;
  } else if (distance >= dangerThreshold && distance <= maxCm) {
    zoneState = "caution";
    zoneLabel = "Caution Zone";
    zoneDescription = `Alert perimeter (${Math.round(dangerThreshold)}–${maxCm} cm)`;
  } else {
    // minCm <= distance < dangerThreshold
    zoneState = "danger";
    zoneLabel = "Danger Zone";
    zoneDescription = `Immediate proximity (${minCm}–${Math.round(dangerThreshold)} cm)`;
  }

  // Prediction calculations matching firmware rules
  const isApproaching = direction === "Approaching" && speedCmS >= 1.0 && !isNoEcho && !isDisarmed;
  let predictionHero = "No approach detected";
  let predictionSub = "Target is stationary or receding";
  let predictionTone: "neutral" | "cyan" | "danger" = "neutral";

  if (isDisarmed) {
    predictionHero = "Not monitoring";
    predictionSub = "Sensor is currently disarmed";
  } else if (isNoEcho) {
    predictionHero = "Waiting for echo";
    predictionSub = "Valid reflection needed for prediction";
  } else if (distance < minCm) {
    predictionHero = "Below alert range";
    predictionTone = "neutral";
    if (isApproaching && speedCmS >= 1.0) {
      const timeToSensor = distance / speedCmS;
      const tSensorStr =
        timeToSensor > 60 ? "more than 1 min" : `${Math.max(1, Math.round(timeToSensor))} s`;
      predictionSub = `Reaches the sensor in about ${tSensorStr}`;
    } else {
      predictionSub = `Under trigger threshold (< ${minCm} cm)`;
    }
  } else if (placeholderReason) {
    predictionHero = placeholderReason;
    predictionSub = "Kinematics currently paused";
  } else if (isApproaching) {
    if (distance <= maxCm && distance >= minCm) {
      // Inside the alert zone
      predictionHero = "Inside the alert zone";
      predictionTone = "danger";

      const timeToSensor = distance / speedCmS;
      const tSensorStr =
        timeToSensor > 60 ? "more than 1 min" : `${Math.max(1, Math.round(timeToSensor))} s`;
      predictionSub = `Reaches the sensor in about ${tSensorStr}`;
    } else if (distance > maxCm) {
      // Outside alert zone approaching
      predictionTone = "cyan";
      const timeToZone = (distance - maxCm) / speedCmS;
      const tZoneStr =
        timeToZone > 60 ? "more than 1 min" : `${Math.max(1, Math.round(timeToZone))} s`;

      predictionHero = `Enters alert zone in about ${tZoneStr}`;

      const timeToSensor = distance / speedCmS;
      const tSensorStr =
        timeToSensor > 60 ? "more than 1 min" : `${Math.max(1, Math.round(timeToSensor))} s`;
      predictionSub = `Reaches the sensor in about ${tSensorStr}`;
    }
  } else if (direction === "Moving away") {
    predictionHero = "Moving away";
    predictionSub = "Target is receding from sensor";
  } else {
    // Steady
    predictionHero = "Target is steady";
    predictionSub = "Distance is remaining constant";
  }

  // Zone track visual metrics
  // Scale bar from 0 to scaleMax (at least maxCm * 1.3)
  const scaleMax = Math.max(100, Math.round(maxCm * 1.3));
  const markerPercent =
    !isNoEcho && distance >= 0
      ? Math.min(100, Math.max(0, (distance / scaleMax) * 100))
      : null;

  // Segment widths percentage
  const belowRangePct = (minCm / scaleMax) * 100;
  const dangerPct = ((dangerThreshold - minCm) / scaleMax) * 100;
  const cautionPct = ((maxCm - dangerThreshold) / scaleMax) * 100;
  const clearPct = ((scaleMax - maxCm) / scaleMax) * 100;

  return (
    <div className="space-y-3">
      {/* ── Section Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Smart Insights"
          icon={<Activity className="h-4 w-4" />}
        />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted border border-border/60 bg-white/[0.02] px-2 py-0.5 rounded-full">
          Real-time Kinematics
        </span>
      </div>

      {/* ── Three Insight Cards Row ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1) MOTION CARD — Always visible, fixed height, seamless states */}
        <GlassCard hover className="p-5 flex flex-col justify-between relative overflow-hidden min-h-[175px]">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Motion Analysis</span>
            {isHolding ? (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-warning/40 bg-warning/10 text-warning animate-pulse">
                holding last reading
              </span>
            ) : placeholderReason ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-border/50 bg-white/[0.02] text-muted/70">
                Standby
              </span>
            ) : (
              <span
                className={cn(
                  "text-[10px] font-mono px-2 py-0.5 rounded-full border capitalize",
                  confidence === "high"
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : confidence === "medium"
                    ? "border-white/10 bg-white/[0.03] text-muted"
                    : "border-border/40 text-muted/60"
                )}
              >
                {confidence} conf
              </span>
            )}
          </div>

          <div
            className={cn(
              "my-2 flex items-center gap-4 transition-opacity duration-300",
              isHolding && "opacity-70"
            )}
          >
            {/* Animated Direction Indicator */}
            <div
              className={cn(
                "h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center border transition-all duration-300",
                placeholderReason
                  ? "border-border/50 bg-white/[0.02] text-muted/60"
                  : direction === "Approaching"
                  ? "border-accent/50 bg-accent/15 text-accent shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                  : direction === "Moving away"
                  ? "border-white/20 bg-white/[0.04] text-text/80"
                  : "border-border/50 bg-white/[0.02] text-muted"
              )}
            >
              {placeholderReason ? (
                <Radio className="h-6 w-6 opacity-40" />
              ) : direction === "Approaching" ? (
                <motion.div
                  animate={prefersReducedMotion ? undefined : { y: [0, 4, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    ease: "easeInOut",
                  }}
                  className="flex flex-col items-center"
                >
                  <ArrowDown className="h-6 w-6 stroke-[2.5]" />
                </motion.div>
              ) : direction === "Moving away" ? (
                <motion.div
                  animate={prefersReducedMotion ? undefined : { y: [0, -4, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    ease: "easeInOut",
                  }}
                  className="flex flex-col items-center"
                >
                  <ArrowUp className="h-6 w-6 stroke-[2.2]" />
                </motion.div>
              ) : direction === "Steady" ? (
                <Minus className="h-6 w-6 stroke-[2.5]" />
              ) : (
                <HelpCircle className="h-6 w-6 opacity-60" />
              )}
            </div>

            {/* Direction & Speed */}
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-bold tracking-tight truncate",
                  placeholderReason
                    ? "text-muted"
                    : direction === "Approaching"
                    ? "text-accent"
                    : direction === "Moving away"
                    ? "text-text"
                    : "text-muted"
                )}
              >
                {placeholderReason ?? direction}
              </p>

              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-text tracking-tight">
                  {placeholderReason || direction === "Steady"
                    ? "--"
                    : speedCmS.toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-muted font-mono">cm/s</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted font-mono">
            <span>Linear regression</span>
            <span>
              {isHolding
                ? "holding last reading"
                : placeholderReason
                ? placeholderReason
                : `${sampleCount} ${sampleCount === 1 ? "sample" : "samples"} (10s)`}
            </span>
          </div>
        </GlassCard>

        {/* 2) PREDICTION CARD */}
        <GlassCard hover className="p-5 flex flex-col justify-between relative overflow-hidden min-h-[175px]">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-accent" />
              Prediction
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider font-bold text-accent bg-accent/10 border border-accent/25 px-1.5 py-0.5 rounded">
              Estimate
            </span>
          </div>

          <div className="my-2 space-y-1.5">
            <p
              className={cn(
                "text-base sm:text-lg font-bold tracking-tight leading-snug",
                predictionTone === "danger"
                  ? "text-danger"
                  : predictionTone === "cyan"
                  ? "text-accent"
                  : "text-text/80"
              )}
            >
              {predictionHero}
            </p>

            <p className="text-xs text-muted flex items-center gap-1.5">
              {predictionTone === "danger" ? (
                <AlertTriangle className="h-3.5 w-3.5 text-danger shrink-0" />
              ) : predictionTone === "cyan" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 animate-ping" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-muted/60 shrink-0" />
              )}
              <span>{predictionSub}</span>
            </p>
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted font-mono">
            <span>Alert boundary</span>
            <span>{maxCm} cm</span>
          </div>
        </GlassCard>

        {/* 3) ZONE CARD */}
        <GlassCard hover className="p-5 flex flex-col justify-between relative overflow-hidden min-h-[175px]">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-accent" />
              Proximity Zone
            </span>
            <span
              className={cn(
                "text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold",
                zoneState === "danger"
                  ? "border-danger/40 bg-danger/15 text-danger animate-pulse"
                  : zoneState === "caution"
                  ? "border-warning/40 bg-warning/15 text-warning"
                  : zoneState === "clear"
                  ? "border-success/40 bg-success/15 text-success"
                  : "border-border/40 bg-white/[0.02] text-muted"
              )}
            >
              {zoneLabel}
            </span>
          </div>

          {/* Segmented Bar Track: [Grey (< minCm) | Red (Danger) | Amber (Caution) | Green (Clear)] */}
          <div className="my-2 space-y-2">
            <div className="relative w-full h-3 rounded-full bg-white/[0.04] p-0.5 overflow-hidden flex border border-border/40">
              {/* Neutral grey segment for distance below alert range (< minCm) */}
              <div
                style={{ width: `${belowRangePct}%` }}
                className="h-full bg-white/[0.06] border-r border-border/80 rounded-l-full"
                title={`Below alert range: 0 to ${minCm} cm`}
              />
              {/* Danger segment (red, nearest third of [minCm, maxCm]) */}
              <div
                style={{ width: `${dangerPct}%` }}
                className="h-full bg-danger/40 border-r border-danger/60"
                title={`Danger zone: ${minCm} to ${Math.round(dangerThreshold)} cm`}
              />
              {/* Caution segment (amber, upper two thirds of [minCm, maxCm]) */}
              <div
                style={{ width: `${cautionPct}%` }}
                className="h-full bg-warning/35 border-r border-warning/60"
                title={`Caution zone: ${Math.round(dangerThreshold)} to ${maxCm} cm`}
              />
              {/* Clear segment (emerald/cyan, beyond maxCm) */}
              <div
                style={{ width: `${clearPct}%` }}
                className="h-full bg-success/20 rounded-r-full"
                title={`Clear zone: > ${maxCm} cm`}
              />

              {/* Dynamic Distance Marker Pin */}
              {markerPercent !== null && (
                <div
                  className="absolute top-0 bottom-0 w-1.5 -ml-0.5 bg-white shadow-[0_0_8px_#ffffff] rounded-full z-10 transition-all duration-300"
                  style={{ left: `${markerPercent}%` }}
                  title={`Current distance: ${distance} cm`}
                />
              )}
            </div>

            {/* Labels under the bar */}
            <div className="flex items-center justify-between text-[10px] text-muted font-mono pt-0.5">
              <span className="flex items-center gap-1 text-muted/70">
                <span className="h-1.5 w-1.5 rounded-full bg-muted/60" />
                <span>&lt;{minCm}cm</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                <span>Danger ({minCm}–{Math.round(dangerThreshold)})</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                <span>Caution ({Math.round(dangerThreshold)}–{maxCm})</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                <span>Clear (&gt;{maxCm})</span>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted font-mono">
            <span>Status</span>
            <span className="text-text font-medium">{zoneDescription}</span>
          </div>
        </GlassCard>
      </div>

      {/* ── Honest Note Under the Row ──────────────────────────────────── */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted/70 pt-1 pb-1">
        <Info className="h-3.5 w-3.5 shrink-0 text-muted/60" />
        <span>Estimates use about 1 sample per second, so fast movements are approximate.</span>
      </div>
    </div>
  );
}
