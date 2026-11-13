"use client";

import { useMemo, useRef } from "react";
import { useDistanceBuffer } from "@/context/DistanceBufferProvider";
import { useLive } from "@/hooks/useLive";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";

export type MotionDirection = "Approaching" | "Moving away" | "Steady" | "Unknown";
export type MotionConfidence = "high" | "medium" | "low";

export interface MotionInsights {
  /** Direction of movement relative to the sensor */
  direction: MotionDirection;
  /** Speed in cm/s (absolute value, rounded to 1 decimal) */
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
 * Uses a linear regression slope over the last ~6 seconds of buffer samples
 * so that single noisy readings cannot flip the result.
 * Includes hysteresis to prevent flickering between states.
 */
export function useMotionInsights(): MotionInsights {
  const samples = useDistanceBuffer();
  const live = useLive();
  const { online } = useDeviceStatus();

  // Persistent direction ref for hysteresis
  const prevDirectionRef = useRef<MotionDirection>("Unknown");

  return useMemo(() => {
    // 1. Check basic validity constraints
    if (
      !online ||
      !live ||
      live.status === "disarmed" ||
      live.distance === -1 ||
      samples.length < 3
    ) {
      prevDirectionRef.current = "Unknown";
      return {
        direction: "Unknown",
        speedCmS: 0,
        confidence: "low",
        slope: 0,
        sampleCount: 0,
      };
    }

    // 2. Select valid samples from the last ~6.5 seconds
    const latestSampleTs = samples[samples.length - 1].timestamp;

    // If latest sample is older than 4.5s, data is stale
    if (Date.now() - latestSampleTs > 4500) {
      prevDirectionRef.current = "Unknown";
      return {
        direction: "Unknown",
        speedCmS: 0,
        confidence: "low",
        slope: 0,
        sampleCount: 0,
      };
    }

    const windowCutoff = latestSampleTs - 6500;
    const validSamples = samples.filter(
      (s) => s.timestamp >= windowCutoff && s.distance !== null && s.distance >= 0
    );

    if (validSamples.length < 3) {
      prevDirectionRef.current = "Unknown";
      return {
        direction: "Unknown",
        speedCmS: 0,
        confidence: "low",
        slope: 0,
        sampleCount: validSamples.length,
      };
    }

    // 3. Simple Linear Regression: distance = slope * time + intercept
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
    const speedCmS = Math.round(rawSpeed * 10) / 10;

    // 4. Direction determination with Hysteresis
    // - Steady threshold is around 2.0 cm/s
    // - Transition from Steady requires > 2.4 cm/s
    // - Return to Steady requires < 1.6 cm/s
    const prev = prevDirectionRef.current;
    let newDirection: MotionDirection = "Steady";

    if (prev === "Steady") {
      if (slope < -2.4) {
        newDirection = "Approaching";
      } else if (slope > 2.4) {
        newDirection = "Moving away";
      } else {
        newDirection = "Steady";
      }
    } else if (prev === "Approaching") {
      if (slope > -1.6 && slope < 2.2) {
        newDirection = "Steady";
      } else if (slope >= 2.2) {
        newDirection = "Moving away";
      } else {
        newDirection = "Approaching";
      }
    } else if (prev === "Moving away") {
      if (slope < 1.6 && slope > -2.2) {
        newDirection = "Steady";
      } else if (slope <= -2.2) {
        newDirection = "Approaching";
      } else {
        newDirection = "Moving away";
      }
    } else {
      // From Unknown
      if (rawSpeed < 2.0) {
        newDirection = "Steady";
      } else if (slope <= -2.0) {
        newDirection = "Approaching";
      } else {
        newDirection = "Moving away";
      }
    }

    prevDirectionRef.current = newDirection;

    // 5. Confidence scoring
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
      if (variance < 2.0) confidence = "high";
      else if (variance < 6.0) confidence = "medium";
      else confidence = "low";
    } else {
      const r2 = sumDD > 0.001 ? 1 - ssRes / sumDD : 0;
      if (r2 >= 0.85 && n >= 4) {
        confidence = "high";
      } else if (r2 >= 0.6 || n >= 3) {
        confidence = "medium";
      } else {
        confidence = "low";
      }
    }

    return {
      direction: newDirection,
      speedCmS,
      confidence,
      slope,
      sampleCount: n,
    };
  }, [samples, live, online]);
}
