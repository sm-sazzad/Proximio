"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Live, Control } from "@/lib/types";

interface RadarGaugeProps {
  live: Live | null;
  control: Control | null;
  className?: string;
}

interface BlipPosition {
  x: number;
  y: number;
  distance: number;
  status: Live["status"];
  timestamp: number;
}

export function RadarGauge({ live, control, className = "" }: RadarGaugeProps) {
  const shouldReduceMotion = useReducedMotion();

  // Radar geometry: center at (200, 200), radius R = 170
  const cx = 200;
  const cy = 200;
  const R = 170;

  // Maximum scale derived from control.maxCm (min 100cm, step of 50cm, max 400cm)
  const maxThreshold = control?.maxCm ?? 50;
  const maxScale = Math.min(400, Math.max(100, Math.ceil(maxThreshold / 50) * 50));

  const distance = live?.distance ?? -1;
  const status = live?.status ?? "safe";
  const isOutOfRange = distance > maxScale;
  const isNoEcho = distance === -1;

  // Geometrically accurate radius: min 9px so it never overlaps the compact center hub (r=3.5)
  const currentRadius = isNoEcho
    ? 0
    : isOutOfRange
    ? R
    : Math.max(9, (distance / maxScale) * R);

  const currentX = cx;
  const currentY = cy - currentRadius;

  // Trail of past positions (only updated when position meaningfully changes)
  const [trail, setTrail] = useState<BlipPosition[]>([]);

  useEffect(() => {
    if (distance > 0) {
      setTrail((prev) => {
        // Avoid duplicate/overlapping dots if distance hasn't changed by at least 3cm
        if (prev.length > 0 && Math.abs(prev[0].distance - distance) < 3) {
          return prev;
        }
        return [
          {
            x: currentX,
            y: currentY,
            distance,
            status,
            timestamp: Date.now(),
          },
          ...prev.slice(0, 1), // Keep at most 2 fading historical positions
        ];
      });
    }
  }, [distance, currentX, currentY, status]);

  // Alert range calculations in scale coordinates
  const minCm = control?.minCm ?? 10;
  const maxCm = control?.maxCm ?? 50;
  const alertRMin = Math.max(0, Math.min(R, (minCm / maxScale) * R));
  const alertRMax = Math.max(0, Math.min(R, (maxCm / maxScale) * R));

  // Determine blip color
  const blipColor =
    status === "alert"
      ? "#F43F5E"
      : isNoEcho
      ? "#8A97AD"
      : status === "nosensor"
      ? "#F59E0B"
      : "#22D3EE";

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 400 225"
        className="w-full max-w-lg h-auto select-none overflow-visible"
        aria-label={`Radar showing ${distance === -1 ? "no echo" : distance + " cm"}`}
      >
        <defs>
          {/* Exact semi-circle clip path for top 180° (y <= 200) */}
          <clipPath id="radar-clip">
            <path d={`M ${cx - R},${cy} A ${R},${R} 0 0,1 ${cx + R},${cy} Z`} />
          </clipPath>

          {/* Sweeper wedge gradient (fades to 0 at trailing edge) */}
          <linearGradient id="sweep-wedge-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="60%" stopColor="#22D3EE" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.28" />
          </linearGradient>
        </defs>

        {/* Semi-circle radar background plate */}
        <path
          d={`M ${cx - R},${cy} A ${R},${R} 0 0,1 ${cx + R},${cy} Z`}
          fill="#0D1424"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />

        {/* Radial Spokes (30°, 60°, 90°, 120°, 150°) */}
        {[30, 60, 90, 120, 150].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x = cx - R * Math.cos(rad);
          const y = cy - R * Math.sin(rad);
          return (
            <line
              key={deg}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={deg === 90 ? "1.5" : "1"}
              strokeDasharray={deg === 90 ? undefined : "3 3"}
            />
          );
        })}

        {/* Highlighted Alert Band (minCm to maxCm) */}
        {alertRMax > alertRMin && (
          <path
            d={`M ${cx - alertRMax},${cy} A ${alertRMax},${alertRMax} 0 0,1 ${cx + alertRMax},${cy} L ${cx + alertRMin},${cy} A ${alertRMin},${alertRMin} 0 0,0 ${cx - alertRMin},${cy} Z`}
            fill="rgba(244, 63, 94, 0.12)"
            stroke="rgba(244, 63, 94, 0.45)"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
        )}

        {/* Concentric Distance Rings */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const r = R * ratio;
          const ringDist = Math.round(maxScale * ratio);
          return (
            <g key={ratio}>
              <path
                d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
              <text
                x={cx + 4}
                y={cy - r + 11}
                fill="#8A97AD"
                fontSize="8.5"
                fontFamily="monospace"
                className="select-none font-medium opacity-75"
              >
                {ringDist}cm
              </text>
            </g>
          );
        })}

        {/* ── Sweeping Radar Beam (originating exactly at center cx=200, cy=200) ── */}
        <g clipPath="url(#radar-clip)">
          <g transform={shouldReduceMotion ? `rotate(-90 ${cx} ${cy})` : undefined}>
            {!shouldReduceMotion && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`-180 ${cx} ${cy}`}
                to={`0 ${cx} ${cy}`}
                dur="4s"
                repeatCount="indefinite"
              />
            )}
            {/* Trailing wedge originating at center (200, 200), 25° wide */}
            <path
              d={`M ${cx},${cy} L 354.1,128.2 A ${R},${R} 0 0,1 ${cx + R},${cy} Z`}
              fill="url(#sweep-wedge-gradient)"
            />
            {/* Soft beam glow */}
            <line
              x1={cx}
              y1={cy}
              x2={cx + R}
              y2={cy}
              stroke="#22D3EE"
              strokeWidth="2.5"
              strokeOpacity="0.25"
            />
            {/* Leading sweep line */}
            <line
              x1={cx}
              y1={cy}
              x2={cx + R}
              y2={cy}
              stroke="#22D3EE"
              strokeWidth="1.5"
              strokeOpacity="0.9"
            />
            {/* Outer tip locator dot */}
            <circle cx={cx + R} cy={cy} r={1.5} fill="#22D3EE" opacity="0.9" />
          </g>
        </g>

        {/* ── Fading Position Trail (filtered to never overlap main blip) ── */}
        {!isNoEcho &&
          trail
            .filter((pos) => Math.abs(pos.y - currentY) >= 8)
            .map((pos, index) => (
              <circle
                key={pos.timestamp}
                cx={pos.x}
                cy={pos.y}
                r={index === 0 ? 2 : 1.5}
                fill={pos.status === "alert" ? "#F43F5E" : "#22D3EE"}
                opacity={index === 0 ? 0.35 : 0.15}
              />
            ))}

        {/* ── Active Target Blip (Single Clean Dot with Glow & Ping Ripple) ── */}
        {!isNoEcho && (
          <g>
            {/* Ping Ripple */}
            <motion.circle
              cx={currentX}
              cy={currentY}
              r={4}
              stroke={blipColor}
              strokeWidth={1}
              fill="none"
              animate={{
                r: status === "alert" ? [4, 14] : [4, 11],
                opacity: [0.75, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: status === "alert" ? 0.9 : 1.6,
                ease: "easeOut",
              }}
            />

            {/* Soft Ambient Glow Halo */}
            <circle
              cx={currentX}
              cy={currentY}
              r={7}
              fill={blipColor}
              opacity={status === "alert" ? 0.4 : 0.22}
            />

            {/* Single Clean Core Dot */}
            <motion.circle
              cx={currentX}
              cy={currentY}
              r={3.5}
              fill={blipColor}
              stroke="#FFFFFF"
              strokeWidth={1.2}
              animate={{ cx: currentX, cy: currentY }}
              transition={{ type: "spring", stiffness: 85, damping: 15 }}
            />
          </g>
        )}

        {/* Compact Center Radar Emitter */}
        <circle cx={cx} cy={cy} r={3.5} fill="#0A0F1C" stroke="#22D3EE" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={1.5} fill="#22D3EE" />

        {/* Baseline Ground Plate */}
        <line
          x1={cx - R - 10}
          y1={cy}
          x2={cx + R + 10}
          y2={cy}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Badges / Hints below gauge */}
      <div className="flex items-center gap-3 -mt-2 text-xs">
        {isOutOfRange && (
          <span className="rounded-full bg-warning/15 px-2.5 py-0.5 font-semibold text-warning">
            Beyond {maxScale}cm scale
          </span>
        )}
        {isNoEcho && (
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-muted">
            No Echo Detected
          </span>
        )}
        {!isNoEcho && !isOutOfRange && (
          <span className="text-[11px] font-mono text-muted">
            Target: <strong className="text-text">{distance} cm</strong>
          </span>
        )}
        <span className="text-[11px] text-muted">
          Scale: 0–{maxScale} cm
        </span>
      </div>
    </div>
  );
}
