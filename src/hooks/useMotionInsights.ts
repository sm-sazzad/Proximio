"use client";

import { useMemo, useRef } from "react";
import { useDistanceBuffer } from "@/context/DistanceBufferProvider";
import { useLive } from "@/hooks/useLive";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { useServerTimeOffset } from "@/hooks/useServerTimeOffset";

export type MotionDirection = "Approaching" | "Moving away" | "Steady" | "Unknown";
export type MotionConfidence = "high" | "medium" | "low";

export interface MotionInsights {
  /** Direction of movement relative to the sensor */
  direction: MotionDirection;
  /** Speed in cm/s (smoothed absolute value, rounded to 1 decimal) */
  speedCmS: number;
  /** Confidence in the regression fit and sample density */
  confidence: MotionConfidence;
  /** Raw linear regression slope in cm/s (negative = approaching) */
  slope: number;
  /** Number of valid samples used in calculation */
  sampleCount: number;
}

/**
 * Computes speed and direction of an object relative to the ultrasonic sensor.
 * Uses a linear regression slope over the last ~8 seconds of buffer samples
 * so that single noisy readings or transient network lags cannot flip the result.
 * Includes hysteresis and state smoothing to prevent flickering between states.
 */
export function useMotionInsights(): MotionInsights {
  const samples = useDistanceBuffer();
  const live = useLive();
  const { online, secondsAgo } = useDeviceStatus();
  const offset = useServerTimeOffset();

  // Persistent refs for hysteresis, smoothing, and transient hold
  const prevDirectionRef = useRef<MotionDirection>("Unknown");
  const prevSpeedRef = useRef<number>(0);
  const lastValidCalcRef = useRef<{
    time: number;
    insights: MotionInsights;
  } | null>(null);

  return useMemo(() => {
    // 1. Hard validity constraints: offline or disarmed
    if (!online || !live || live.status === "disarmed") {
      prevDirectionRef.current = "Unknown";
      prevSpeedRef.current = 0;
      lastValidCalcRef.current = null;
      return {
        direction: "Unknown",
        speedCmS: 0,
        confidence: "low",
        slope: 0,
        sampleCount: 0,
      };
    }

    // 2. Determine reference timestamp using server offset
    const serverNow = Date.now() + offset;

    // If device hasn't sent data for > 8s, mark as stale
    if (secondsAgo !== null && secondsAgo > 8) {
      prevDirectionRef.current = "Unknown";
      prevSpeedRef.current = 0;
      lastValidCalcRef.current = null;
      return {
        direction: "Unknown",
        speedCmS: 0,
        confidence: "low",
        slope: 0,
        sampleCount: 0,
      };
    }

    // 3. Select valid (non-null, non-negative) samples from a robust ~8.5s rolling window
    // This accommodates network latency and variable ESP32 loop times (1.0s–1.5s)
    const latestSampleTs =
      samples.length > 0 ? samples[samples.length - 1].timestamp : live.ts;

    const windowCutoff = latestSampleTs - 8500;
    const validSamples = samples.filter(
      (s) => s.timestamp >= windowCutoff && s.distance !== null && s.distance >= 0
    );

    // If buffer currently has fewer than 3 valid samples:
    if (validSamples.length < 3) {
      // If we had a recent valid calculation within the last 2.5s, hold it smoothly
      if (
        lastValidCalcRef.current &&
        serverNow - lastValidCalcRef.current.time < 2500
      ) {
        return {
          ...lastValidCalcRef.current.insights,
          sampleCount: validSamples.length,
        };
      }

      // Otherwise, genuinely waiting for data accumulation
      prevDirectionRef.current = "Unknown";
      prevSpeedRef.current = 0;
      return {
        direction: "Unknown",
        speedCmS: 0,
        confidence: "low",
        slope: 0,
        sampleCount: validSamples.length,
      };
    }

    // 4. Simple Linear Regression: distance = slope * time + intercept
    const n = validSamples.length;
    const t0 = validSamples[0].timestamp;

    let sumT = 0;
    let sumD = 0;

    for (let i = 0; i < n; i++) {
      const t = (validSamples[i].timestamp - t0) / 1000; // in seconds
      const d = validSamples[i].distance!;
      sumT += t;
      sumD += d;
    }

    const meanT = sumT / n;
    const meanD = sumD / n;

    let sumTD = 0;
    let sumTT = 0;
    let sumDD = 0;

    for (let i = 0; i < n; i++) {
      const t = (validSamples[i].timestamp - t0) / 1000;
      const d = validSamples[i].distance!;
      const diffT = t - meanT;
      const diffD = d - meanD;

      sumTD += diffT * diffD;
      sumTT += diffT * diffT;
      sumDD += diffD * diffD;
    }

    const slope = sumTT > 0.001 ? sumTD / sumTT : 0;
    const rawSpeed = Math.abs(slope);

    // Smooth speed with exponential moving average to prevent display jitter
    const prevSpeed = prevSpeedRef.current;
    const smoothedSpeed =
      prevSpeed > 0
        ? Math.round((prevSpeed * 0.35 + rawSpeed * 0.65) * 10) / 10
        : Math.round(rawSpeed * 10) / 10;
    prevSpeedRef.current = smoothedSpeed;

    // 5. Direction determination with Hysteresis
    // - Steady threshold is around 2.0 cm/s
    // - Transition from Steady requires > 2.2 cm/s
    // - Return to Steady requires < 1.7 cm/s
    const prev = prevDirectionRef.current;
    let newDirection: MotionDirection = "Steady";

    if (prev === "Steady") {
      if (slope < -2.2) {
        newDirection = "Approaching";
      } else if (slope > 2.2) {
        newDirection = "Moving away";
      } else {
        newDirection = "Steady";
      }
    } else if (prev === "Approaching") {
      if (slope > -1.7 && slope < 2.0) {
        newDirection = "Steady";
      } else if (slope >= 2.0) {
        newDirection = "Moving away";
      } else {
        newDirection = "Approaching";
      }
    } else if (prev === "Moving away") {
      if (slope < 1.7 && slope > -2.0) {
        newDirection = "Steady";
      } else if (slope <= -2.0) {
        newDirection = "Approaching";
      } else {
        newDirection = "Moving away";
      }
    } else {
      // From Unknown / Initializing
      if (rawSpeed < 2.0) {
        newDirection = "Steady";
      } else if (slope <= -2.0) {
        newDirection = "Approaching";
      } else {
        newDirection = "Moving away";
      }
    }

    prevDirectionRef.current = newDirection;

    // 6. Confidence scoring
    // Residual sum of squares: SS_res = sum((d_i - pred_i)^2)
    let ssRes = 0;
    for (let i = 0; i < n; i++) {
      const t = (validSamples[i].timestamp - t0) / 1000;
      const d = validSamples[i].distance!;
      const pred = meanD + slope * (t - meanT);
      ssRes += (d - pred) * (d - pred);
    }

    let confidence: MotionConfidence = "low";

    if (newDirection === "Steady") {
      const variance = sumDD / n;
      if (variance < 2.5) confidence = "high";
      else if (variance < 6.0) confidence = "medium";
      else confidence = "low";
    } else {
      const r2 = sumDD > 0.001 ? 1 - ssRes / sumDD : 0;
      if (r2 >= 0.8 && n >= 4) {
        confidence = "high";
      } else if (r2 >= 0.55 || n >= 3) {
        confidence = "medium";
      } else {
        confidence = "low";
      }
    }

    const result: MotionInsights = {
      direction: newDirection,
      speedCmS: newDirection === "Steady" ? 0 : smoothedSpeed,
      confidence,
      slope,
      sampleCount: n,
    };

    // Cache this calculation for transient hold
    lastValidCalcRef.current = {
      time: serverNow,
      insights: result,
    };

    return result;
  }, [samples, live, online, secondsAgo, offset]);
}
