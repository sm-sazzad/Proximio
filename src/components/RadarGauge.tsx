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

  // Radar geometry
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

  // Compute blip position on central axis (forward-pointing 90° beam)
  const currentRadius = isNoEcho
    ? 0
    : isOutOfRange
    ? R
    : Math.max(10, (distance / maxScale) * R);

  const currentX = cx;
  const currentY = cy - currentRadius;

  // Trail of past positions (up to 3 previous positions)
  const [trail, setTrail] = useState<BlipPosition[]>([]);

  useEffect(() => {
    if (distance > 0) {
      setTrail((prev) => {
        const next = [
          {
            x: currentX,
            y: currentY,
            distance,
            status,
            timestamp: Date.now(),
          },
          ...prev.slice(0, 2),
        ];
        return next;
      });
    }
  }, [distance, currentX, currentY, status]);

  // Alert range calculations
  const minCm = control?.minCm ?? 10;
  const maxCm = control?.maxCm ?? 50;
  const alertRMin = Math.max(0, Math.min(R, (minCm / maxScale) * R));
  const alertRMax = Math.max(0, Math.min(R, (maxCm / maxScale) * R));

  // Determine blip color based on state
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
          {/* Clip to upper 180° semi-circle */}
          <clipPath id="radar-clip">
            <path d={`M ${cx - R - 2},${cy} A ${R + 2},${R + 2} 0 0,1 ${cx + R + 2},${cy} L ${cx + R + 2},${cy + 2} L ${cx - R - 2},${cy + 2} Z`} />
          </clipPath>

          {/* Sweeper beam gradient */}
          <linearGradient id="sweep-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35" />
            <stop offset="70%" stopColor="#22D3EE" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </linearGradient>

          {/* Alert band glow filter */}
          <filter id="alert-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Semi-circle background grid */}
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
              {/* Distance label along the vertical spoke */}
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

        {/* Sweeping Radar Beam */}
        <g clipPath="url(#radar-clip)">
          <motion.g
            animate={
              shouldReduceMotion
                ? { rotate: -45 }
                : { rotate: [-180, 0] }
            }
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "linear",
            }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            {/* Soft gradient sweep cone */}
            <path
              d={`M ${cx},${cy} L ${cx + R + 10},${cy} A ${R + 10},${R + 10} 0 0,0 ${cx + (R + 10) * Math.cos((25 * Math.PI) / 180)},${cy - (R + 10) * Math.sin((25 * Math.PI) / 180)} Z`}
              fill="url(#sweep-gradient)"
            />
            {/* Leading sweep line */}
            <line
              x1={cx}
              y1={cy}
              x2={cx + R}
              y2={cy}
              stroke="#22D3EE"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />
          </motion.g>
        </g>

        {/* Fading blip trail */}
        {!isNoEcho &&
          trail.map((pos, index) => {
            const opacity = 0.35 / (index + 1);
            return (
              <circle
                key={pos.timestamp}
                cx={pos.x}
                cy={pos.y}
                r={4}
                fill={pos.status === "alert" ? "#F43F5E" : "#22D3EE"}
                opacity={opacity}
              />
            );
          })}

        {/* Active Target Blip */}
        {!isNoEcho && (
          <g>
            {/* Outer halo during alert or normal */}
            <motion.circle
              cx={currentX}
              cy={currentY}
              r={status === "alert" ? 12 : 9}
              fill={blipColor}
              animate={{
                scale: status === "alert" ? [1, 1.4, 1] : [1, 1.2, 1],
                opacity: status === "alert" ? [0.6, 0.15, 0.6] : [0.35, 0.1, 0.35],
              }}
              transition={{
                repeat: Infinity,
                duration: status === "alert" ? 0.9 : 1.8,
                ease: "easeInOut",
              }}
            />

            {/* Core blip with spring transition */}
            <motion.circle
              cx={currentX}
              cy={currentY}
              r={5}
              fill={blipColor}
              stroke="#FFFFFF"
              strokeWidth="1.5"
              animate={{ cx: currentX, cy: currentY }}
              transition={{ type: "spring", stiffness: 75, damping: 14 }}
              filter="drop-shadow(0 0 6px currentColor)"
            />
          </g>
        )}

        {/* Center Sonar Emitter */}
        <circle cx={cx} cy={cy} r={6} fill="#121A2B" stroke="#22D3EE" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={2.5} fill="#22D3EE" />

        {/* Baseline ground plate */}
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
