"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDistanceBuffer } from "@/context/DistanceBufferProvider";
import { useLive } from "@/hooks/useLive";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { useServerTimeOffset } from "@/hooks/useServerTimeOffset";

export type MotionDirection = "Approaching" | "Moving away" | "Steady" | "Unknown";
export type MotionConfidence = "high" | "medium" | "low";
export type MotionPlaceholderReason =
  | "No echo"
  | "Device offline"
  | "Disarmed"
  | "Not enough data yet";

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
  /** True when temporarily holding the last computed reading during data drops (< 4s) */
  isHolding: boolean;
  /** Explanatory reason when in placeholder state */
  placeholderReason: MotionPlaceholderReason | null;
}

/**
 * Computes speed and direction of an object relative to the ultrasonic sensor.
 * Uses a linear regression slope over the last 10 seconds of buffer samples.
 * Recomputes on a 1-second timer and on new data so readings expire correctly.
 * Holds the last reading for up to 4s if samples become insufficient before
 * showing a stable in-card placeholder state.
 */
export function useMotionInsights(): MotionInsights {
  const samples = useDistanceBuffer();
  const live = useLive();
  const { online, secondsAgo } = useDeviceStatus();
  const offset = useServerTimeOffset();

  // 1-second interval timer to guarantee recomputation and expiration
  const [tick, setTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 1_000_000);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Persistent refs for hysteresis, smoothing, and transient hold
  const prevDirectionRef = useRef<MotionDirection>("Unknown");
  const prevSpeedRef = useRef<number>(0);
  const lastValidCalcRef = useRef<{
    time: number;
    insights: Omit<MotionInsights, "isHolding" | "placeholderReason">;
  } | null>(null);

  return useMemo(() => {
    const serverNow = Date.now() + offset;

    // 1. Determine placeholder reason for inactive states
    let placeholderReason: MotionPlaceholderReason = "Not enough data yet";
    if (!online || (secondsAgo !== null && secondsAgo > 10)) {
      placeholderReason = "Device offline";
    } else if (live?.status === "disarmed") {
      placeholderReason = "Disarmed";
    } else if (live?.distance === -1) {
      placeholderReason = "No echo";
    }

    // 2. Select valid samples from the last 10 seconds
    const windowCutoff = serverNow - 10000;
    const validSamples = samples.filter(
      (s) =>
        s.timestamp >= windowCutoff &&
        s.timestamp <= serverNow + 2000 &&
        s.distance !== null &&
        s.distance >= 0
    );

    const isDeviceActive =
      online &&
      (secondsAgo === null || secondsAgo <= 10) &&
      live &&
      live.status !== "disarmed" &&
      live.distance !== -1;

    // 3. If we have at least 3 valid samples and the device is active, compute regression
    if (isDeviceActive && validSamples.length >= 3) {
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

      // Direction determination with Hysteresis
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

      // Confidence scoring
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

      const activeResult = {
        direction: newDirection,
        speedCmS: newDirection === "Steady" ? 0 : smoothedSpeed,
        confidence,
        slope,
        sampleCount: n,
      };

      // Cache this reading for up to 4 seconds of holding
      lastValidCalcRef.current = {
        time: serverNow,
        insights: activeResult,
      };

      return {
        ...activeResult,
        isHolding: false,
        placeholderReason: null,
      };
    }

    // 4. Samples became insufficient or echo temporarily lost:
    // Hold previous computed result for up to 4.0 seconds (unless disarmed or offline)
    if (
      lastValidCalcRef.current &&
      serverNow - lastValidCalcRef.current.time <= 4000 &&
      live?.status !== "disarmed" &&
      online
    ) {
      return {
        ...lastValidCalcRef.current.insights,
        sampleCount: validSamples.length,
        isHolding: true,
        placeholderReason: null,
      };
    }

    // 5. Hold period expired: transition to in-card placeholder state
    lastValidCalcRef.current = null;
    prevDirectionRef.current = "Unknown";
    prevSpeedRef.current = 0;

    return {
      direction: "Unknown",
      speedCmS: 0,
      confidence: "low",
      slope: 0,
      sampleCount: validSamples.length,
      isHolding: false,
      placeholderReason,
    };
  }, [samples, live, online, secondsAgo, offset, tick]);
}
