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

  // Radar geometry: center at (200, 200), outer operational radius R = 170
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

  // Geometrically accurate radius: min 10px so it never overlaps the center emitter hub (r=4.5)
  const currentRadius = isNoEcho
    ? 0
    : isOutOfRange
    ? R
    : Math.max(10, (distance / maxScale) * R);

  const currentX = cx;
  const currentY = cy - currentRadius;

  // Trail of past positions (fading echoes)
  const [trail, setTrail] = useState<BlipPosition[]>([]);

  useEffect(() => {
    if (distance > 0) {
      setTrail((prev) => {
        // Avoid duplicate overlapping dots if distance hasn't changed by at least 2cm
        if (prev.length > 0 && Math.abs(prev[0].distance - distance) < 2) {
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
          ...prev.slice(0, 2), // Keep up to 2 fading historical pings
        ];
      });
    }
  }, [distance, currentX, currentY, status]);

  // Alert range calculations in scale coordinates
  const minCm = control?.minCm ?? 10;
  const maxCm = control?.maxCm ?? 50;
  const alertRMin = Math.max(0, Math.min(R, (minCm / maxScale) * R));
  const alertRMax = Math.max(0, Math.min(R, (maxCm / maxScale) * R));

  // Determine blip & reticle theme color
  const isAlert = status === "alert";
  const blipColor = isAlert
    ? "#F43F5E"
    : isNoEcho
    ? "#8A97AD"
    : status === "nosensor"
    ? "#F59E0B"
    : "#22D3EE";

  // Target callout positioning (flipping downwards if target is near top edge)
  const calloutIsTop = currentY < 50;
  const calloutY = calloutIsTop ? currentY + 16 : currentY - 16;
  const calloutBoxY = calloutIsTop ? currentY + 10 : currentY - 24;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 400 230"
        className="w-full max-w-lg h-auto select-none overflow-visible"
        aria-label={`180 degree Sonar Radar showing ${
          isNoEcho ? "no echo" : distance + " cm"
        }${isAlert ? " - ALERT STATE" : ""}`}
      >
        <defs>
          {/* Exact semi-circle clip path for top 180° (y <= 200) */}
          <clipPath id="radar-clip">
            <path d={`M ${cx - R},${cy} A ${R},${R} 0 0,1 ${cx + R},${cy} Z`} />
          </clipPath>

          {/* Extended clip for dial boundary and ticks (R + 6) */}
          <clipPath id="radar-dial-clip">
            <path d={`M ${cx - (R + 8)},${cy} A ${R + 8},${R + 8} 0 0,1 ${cx + (R + 8)},${cy} Z`} />
          </clipPath>

          {/* Sweeper wedge gradient (trailing phosphor fade) */}
          <linearGradient id="sweep-wedge-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.05" />
            <stop offset="85%" stopColor="#22D3EE" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.32" />
          </linearGradient>

          {/* Tactical micro-dot grid pattern */}
          <pattern
            id="tactical-grid"
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="7" cy="7" r="0.6" fill="#22D3EE" opacity="0.15" />
          </pattern>

          {/* Soft Alert Zone Glow */}
          <radialGradient id="alert-zone-glow" cx="50%" cy="100%" r="100%">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.16" />
            <stop offset="70%" stopColor="#F43F5E" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.02" />
          </radialGradient>
        </defs>

        {/* ── Background Tactical Plate ─────────────────────────────── */}
        <path
          d={`M ${cx - R},${cy} A ${R},${R} 0 0,1 ${cx + R},${cy} Z`}
          fill="#0B1322"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />

        {/* Holographic Tactical Grid Overlay */}
        <path
          d={`M ${cx - R},${cy} A ${R},${R} 0 0,1 ${cx + R},${cy} Z`}
          fill="url(#tactical-grid)"
        />

        {/* ── Outer Degree & Bearing Ticks Scale (every 5° and 10°) ── */}
        {Array.from({ length: 37 }, (_, i) => i * 5).map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const isMajor = deg % 30 === 0;
          const isMid = deg % 10 === 0;
          const tickLen = isMajor ? 7 : isMid ? 4.5 : 2.5;

          const x1 = cx - R * Math.cos(rad);
          const y1 = cy - R * Math.sin(rad);
          const x2 = cx - (R - tickLen) * Math.cos(rad);
          const y2 = cy - (R - tickLen) * Math.sin(rad);

          return (
            <line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={
                isMajor
                  ? "rgba(34, 211, 238, 0.45)"
                  : isMid
                  ? "rgba(255, 255, 255, 0.18)"
                  : "rgba(255, 255, 255, 0.08)"
              }
              strokeWidth={isMajor ? "1.2" : "0.8"}
            />
          );
        })}

        {/* Degree Compass Labels (0°, 30°, 60°, 90° FWD, 120°, 150°, 180°) */}
        {[
          { deg: 0, label: "0°" },
          { deg: 30, label: "30°" },
          { deg: 60, label: "60°" },
          { deg: 90, label: "90° FWD" },
          { deg: 120, label: "120°" },
          { deg: 150, label: "150°" },
          { deg: 180, label: "180°" },
        ].map(({ deg, label }) => {
          const rad = (deg * Math.PI) / 180;
          const labelR = R - 13;
          const lx = cx - labelR * Math.cos(rad);
          const ly = cy - labelR * Math.sin(rad);

          return (
            <text
              key={deg}
              x={lx}
              y={ly + (deg === 90 ? -2 : 2.5)}
              textAnchor="middle"
              fill={deg === 90 ? "#22D3EE" : "#8A97AD"}
              fontSize={deg === 90 ? "6.5" : "5.5"}
              fontFamily="monospace"
              fontWeight={deg === 90 ? "bold" : "normal"}
              opacity={deg === 90 ? 0.95 : 0.6}
              className="select-none"
            >
              {label}
            </text>
          );
        })}

        {/* ── Radial Spokes (30°, 60°, 90°, 120°, 150°) ──────────────── */}
        {[30, 60, 90, 120, 150].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const innerR = 12; // Start outside emitter hub
          const x1 = cx - innerR * Math.cos(rad);
          const y1 = cy - innerR * Math.sin(rad);
          const x2 = cx - (R - 18) * Math.cos(rad);
          const y2 = cy - (R - 18) * Math.sin(rad);

          return (
            <line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={
                deg === 90
                  ? "rgba(34, 211, 238, 0.25)"
                  : "rgba(255, 255, 255, 0.05)"
              }
              strokeWidth={deg === 90 ? "1.2" : "0.9"}
              strokeDasharray={deg === 90 ? "3 2" : "2 3"}
            />
          );
        })}

        {/* ── Highlighted Alert Band (minCm to maxCm) ─────────────────── */}
        {alertRMax > alertRMin && (
          <g>
            <path
              d={`M ${cx - alertRMax},${cy} A ${alertRMax},${alertRMax} 0 0,1 ${cx + alertRMax},${cy} L ${cx + alertRMin},${cy} A ${alertRMin},${alertRMin} 0 0,0 ${cx - alertRMin},${cy} Z`}
              fill="url(#alert-zone-glow)"
              stroke="rgba(244, 63, 94, 0.5)"
              strokeWidth="1.2"
              strokeDasharray="4 2"
            />
            {/* Alert Band Label */}
            <text
              x={cx + alertRMax - 4}
              y={cy - 5}
              textAnchor="end"
              fill="#F43F5E"
              fontSize="6"
              fontFamily="monospace"
              fontWeight="bold"
              opacity="0.8"
              className="select-none"
            >
              ALERT ZONE
            </text>
          </g>
        )}

        {/* ── Concentric Distance Range Rings ─────────────────────────── */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const r = R * ratio;
          const ringDist = Math.round(maxScale * ratio);
          return (
            <g key={ratio}>
              <path
                d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={ratio === 1 ? "1.4" : "0.9"}
                strokeDasharray={ratio === 1 ? undefined : "4 3"}
              />
              <text
                x={cx + 5}
                y={cy - r + 9}
                fill="#8A97AD"
                fontSize="7.5"
                fontFamily="monospace"
                className="select-none font-medium opacity-75"
              >
                {ringDist}cm
              </text>
            </g>
          );
        })}

        {/* ── Target Distance Contour Arc (Active Target Contour Strobe) ── */}
        {!isNoEcho && !isOutOfRange && (
          <path
            d={`M ${cx - currentRadius},${cy} A ${currentRadius},${currentRadius} 0 0,1 ${cx + currentRadius},${cy}`}
            fill="none"
            stroke={blipColor}
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity={isAlert ? 0.6 : 0.35}
          />
        )}

        {/* ── Sweeping Radar Beam (originating exactly at center cx=200, cy=200) ── */}
        <g clipPath="url(#radar-clip)">
          <g transform={shouldReduceMotion ? `rotate(-90 ${cx} ${cy})` : undefined}>
            {!shouldReduceMotion && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`-180 ${cx} ${cy}`}
                to={`35 ${cx} ${cy}`}
                dur="4s"
                repeatCount="indefinite"
              />
            )}
            {/* Trailing phosphor wedge originating at center, ~32° wide */}
            <path
              d={`M ${cx},${cy} L 344.2,110 A ${R},${R} 0 0,1 ${cx + R},${cy} Z`}
              fill="url(#sweep-wedge-gradient)"
            />
            {/* Soft beam ambient neon glow */}
            <line
              x1={cx}
              y1={cy}
              x2={cx + R}
              y2={cy}
              stroke="#22D3EE"
              strokeWidth="3.5"
              strokeOpacity="0.25"
            />
            {/* Leading precision laser sweep line */}
            <line
              x1={cx}
              y1={cy}
              x2={cx + R}
              y2={cy}
              stroke="#22D3EE"
              strokeWidth="1.5"
              strokeOpacity="0.95"
            />
            {/* Outer tip beacon dot */}
            <circle cx={cx + R} cy={cy} r={2} fill="#22D3EE" opacity="0.95" />
          </g>
        </g>

        {/* ── Fading Position Echo Trail ──────────────────────────────── */}
        {!isNoEcho &&
          trail
            .filter((pos) => Math.abs(pos.y - currentY) >= 7)
            .map((pos, index) => (
              <g key={pos.timestamp} opacity={index === 0 ? 0.35 : 0.15}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={index === 0 ? 2.5 : 1.8}
                  fill={pos.status === "alert" ? "#F43F5E" : "#22D3EE"}
                />
              </g>
            ))}

        {/* ── Active Target Blip & Precision HUD Reticle ──────────────── */}
        {!isNoEcho && (
          <g>
            {/* Animated Ping Radar Ripple */}
            <motion.circle
              cx={currentX}
              cy={currentY}
              r={4}
              stroke={blipColor}
              strokeWidth={1.2}
              fill="none"
              animate={{
                r: isAlert ? [4, 16] : [4, 12],
                opacity: [0.85, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: isAlert ? 0.8 : 1.5,
                ease: "easeOut",
              }}
            />

            {/* Target Reticle Precision Crosshair Brackets [ + ] */}
            <g
              stroke={blipColor}
              strokeWidth="1"
              fill="none"
              opacity={isAlert ? 0.95 : 0.8}
            >
              {/* Top-Left Bracket */}
              <path
                d={`M ${currentX - 7},${currentY - 3} L ${currentX - 7},${currentY - 7} L ${currentX - 3},${currentY - 7}`}
              />
              {/* Top-Right Bracket */}
              <path
                d={`M ${currentX + 3},${currentY - 7} L ${currentX + 7},${currentY - 7} L ${currentX + 7},${currentY - 3}`}
              />
              {/* Bottom-Left Bracket */}
              <path
                d={`M ${currentX - 7},${currentY + 3} L ${currentX - 7},${currentY + 7} L ${currentX - 3},${currentY + 7}`}
              />
              {/* Bottom-Right Bracket */}
              <path
                d={`M ${currentX + 3},${currentY + 7} L ${currentX + 7},${currentY + 7} L ${currentX + 7},${currentY + 3}`}
              />
            </g>

            {/* Ambient Core Halo Glow */}
            <circle
              cx={currentX}
              cy={currentY}
              r={8}
              fill={blipColor}
              opacity={isAlert ? 0.45 : 0.22}
            />

            {/* Core Target Dot */}
            <motion.circle
              cx={currentX}
              cy={currentY}
              r={3.5}
              fill={blipColor}
              stroke="#FFFFFF"
              strokeWidth={1.2}
              animate={{ cx: currentX, cy: currentY }}
              transition={{ type: "spring", stiffness: 90, damping: 16 }}
            />

            {/* Tactical Digital HUD Callout Box & Leader Line */}
            {!isOutOfRange && (
              <g className="select-none pointer-events-none">
                {/* Angled leader line */}
                <line
                  x1={currentX + 7}
                  y1={calloutIsTop ? currentY + 7 : currentY - 7}
                  x2={currentX + 16}
                  y2={calloutY}
                  stroke={blipColor}
                  strokeWidth="0.9"
                  opacity="0.75"
                />
                <line
                  x1={currentX + 16}
                  y1={calloutY}
                  x2={currentX + 54}
                  y2={calloutY}
                  stroke={blipColor}
                  strokeWidth="0.9"
                  opacity="0.75"
                />
                {/* Callout Badge Box */}
                <rect
                  x={currentX + 16}
                  y={calloutBoxY}
                  width="44"
                  height="12"
                  rx="2.5"
                  fill="#080E1A"
                  stroke={blipColor}
                  strokeWidth="0.9"
                  opacity="0.95"
                />
                {/* Callout Text */}
                <text
                  x={currentX + 38}
                  y={calloutBoxY + 8.5}
                  textAnchor="middle"
                  fill={isAlert ? "#F43F5E" : "#22D3EE"}
                  fontSize="6.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {isAlert ? "LOCK " : "TGT "}{distance}cm
                </text>
              </g>
            )}
          </g>
        )}

        {/* ── Precision Ultrasonic Sonar Transducer Emitter (Center) ── */}
        <circle
          cx={cx}
          cy={cy}
          r={7.5}
          fill="#060C18"
          stroke="rgba(34, 211, 238, 0.4)"
          strokeWidth="1"
        />
        <circle
          cx={cx}
          cy={cy}
          r={4.5}
          fill="#0A0F1C"
          stroke="#22D3EE"
          strokeWidth="1.5"
        />
        <circle cx={cx} cy={cy} r={2} fill="#22D3EE" />

        {/* Baseline Ground Plane with Precision Limit Caps */}
        <line
          x1={cx - R - 12}
          y1={cy}
          x2={cx + R + 12}
          y2={cy}
          stroke="rgba(255, 255, 255, 0.16)"
          strokeWidth="1.5"
        />
        <line
          x1={cx - R - 12}
          y1={cy - 4}
          x2={cx - R - 12}
          y2={cy + 4}
          stroke="rgba(34, 211, 238, 0.4)"
          strokeWidth="1.2"
        />
        <line
          x1={cx + R + 12}
          y1={cy - 4}
          x2={cx + R + 12}
          y2={cy + 4}
          stroke="rgba(34, 211, 238, 0.4)"
          strokeWidth="1.2"
        />

        {/* ── Corner Tactical Telemetry HUD Annotations ─────────────── */}
        {/* Top-Left: Ultrasonic Transducer Specs */}
        <g className="select-none font-mono">
          <text
            x="14"
            y="18"
            fill="#8A97AD"
            fontSize="7"
            opacity="0.85"
            letterSpacing="0.05em"
          >
            FREQ: <tspan fill="#22D3EE" fontWeight="bold">40 kHz</tspan>
          </text>
          <text
            x="14"
            y="28"
            fill="#8A97AD"
            fontSize="6"
            opacity="0.6"
            letterSpacing="0.04em"
          >
            PULSE: ULTRASONIC
          </text>
        </g>

        {/* Top-Right: Beam FOV & Sample Rate */}
        <g className="select-none font-mono" textAnchor="end">
          <text
            x="386"
            y="18"
            fill="#8A97AD"
            fontSize="7"
            opacity="0.85"
            letterSpacing="0.05em"
          >
            FOV: <tspan fill="#22D3EE" fontWeight="bold">15°</tspan>
          </text>
          <text
            x="386"
            y="28"
            fill="#8A97AD"
            fontSize="6"
            opacity="0.6"
            letterSpacing="0.04em"
          >
            PING: ~1.0 Hz
          </text>
        </g>

        {/* Bottom Baseline Telemetry Status */}
        <text
          x={cx - R}
          y={cy + 16}
          fill="#8A97AD"
          fontSize="6.5"
          fontFamily="monospace"
          opacity="0.7"
          className="select-none"
        >
          SYS: {isAlert ? "BREACH ALERT" : isNoEcho ? "ACQUIRING..." : "TRACKING"}
        </text>
        <text
          x={cx + R}
          y={cy + 16}
          textAnchor="end"
          fill="#8A97AD"
          fontSize="6.5"
          fontFamily="monospace"
          opacity="0.7"
          className="select-none"
        >
          BEARING: 090° FWD
        </text>
      </svg>

      {/* ── Bottom HUD Status Chips ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-1 text-xs">
        {isOutOfRange && (
          <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-[11px] font-semibold text-warning border border-warning/30">
            Target beyond {maxScale}cm scale
          </span>
        )}
        {isNoEcho && (
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-muted border border-border/40 font-mono">
            Searching for Ultrasonic Echo...
          </span>
        )}
        {!isNoEcho && !isOutOfRange && (
          <span className="text-[11px] font-mono text-muted bg-white/[0.02] px-2.5 py-0.5 rounded border border-border/40">
            Detected: <strong className="text-text font-bold">{distance} cm</strong>
          </span>
        )}
        <span className="text-[11px] font-mono text-muted/80">
          Scale: 0–{maxScale} cm
        </span>
      </div>
    </div>
  );
}
