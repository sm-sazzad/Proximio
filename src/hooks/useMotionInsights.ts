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
  /** Speed in cm/s (weighted slope absolute value, rounded to 1 decimal) */
  speedCmS: number;
  /** Confidence in the regression fit and sample density */
  confidence: MotionConfidence;
  /** Weighted linear regression slope in cm/s (negative = approaching) */
  slope: number;
  /** Number of valid samples used in calculation */
  sampleCount: number;
  /** True when temporarily holding the last computed reading during data drops (< 4s) */
  isHolding: boolean;
  /** Explanatory reason when in placeholder state */
  placeholderReason: MotionPlaceholderReason | null;
}

// Exponential weight half-life in seconds (1.5s)
// lambda = ln(2) / halfLife
const HALF_LIFE_S = 1.5;
const LAMBDA = Math.LN2 / HALF_LIFE_S;

/**
 * Computes responsive speed and direction using weighted linear regression
 * over the last 5 seconds of valid samples. Newer samples are exponentially
 * weighted (half-life ~1.5s) so reversals show up within 1-2 seconds.
 * Direction changes require confirmation across 2 consecutive updates.
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

  // Persistent refs for 2-update confirmation, displayed direction, and hold cache
  const displayedDirectionRef = useRef<MotionDirection>("Unknown");
  const pendingCandidateRef = useRef<MotionDirection | null>(null);
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

    // 2. Select valid samples from the last 5 seconds
    const windowCutoff = serverNow - 5000;
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

    // 3. Compute weighted linear regression when at least 3 valid samples exist
    if (isDeviceActive && validSamples.length >= 3) {
      const n = validSamples.length;
      const t0 = validSamples[0].timestamp;

      // Calculate sample weights based on age: w_i = exp(-lambda * delta_t)
      // and weighted means
      let sumW = 0;
      let sumWT = 0;
      let sumWD = 0;

      const tValues: number[] = new Array(n);
      const dValues: number[] = new Array(n);
      const weights: number[] = new Array(n);

      for (let i = 0; i < n; i++) {
        // Real sample timestamps (server-corrected) as x values in seconds
        const t = (validSamples[i].timestamp - t0) / 1000;
        const d = validSamples[i].distance!;
        const ageS = Math.max(0, (serverNow - validSamples[i].timestamp) / 1000);
        const w = Math.exp(-LAMBDA * ageS);

        tValues[i] = t;
        dValues[i] = d;
        weights[i] = w;

        sumW += w;
        sumWT += w * t;
        sumWD += w * d;
      }

      const meanT = sumW > 0 ? sumWT / sumW : 0;
      const meanD = sumW > 0 ? sumWD / sumW : 0;

      let sumWTT = 0;
      let sumWTD = 0;
      let sumWDD = 0;

      for (let i = 0; i < n; i++) {
        const diffT = tValues[i] - meanT;
        const diffD = dValues[i] - meanD;
        const w = weights[i];

        sumWTT += w * diffT * diffT;
        sumWTD += w * diffT * diffD;
        sumWDD += w * diffD * diffD;
      }

      // Weighted slope in cm/s (negative = approaching)
      const weightedSlope = sumWTT > 0.0001 ? sumWTD / sumWTT : 0;
      const rawSpeed = Math.abs(weightedSlope);
      const speedCmS = Math.round(rawSpeed * 10) / 10;

      // Raw candidate direction: Steady if absolute speed < 2.0 cm/s
      let candidate: MotionDirection = "Steady";
      if (rawSpeed >= 2.0) {
        candidate = weightedSlope < 0 ? "Approaching" : "Moving away";
      }

      // 4. Confirmation logic: change displayed direction only after 2 consecutive updates
      let currentDisplayed = displayedDirectionRef.current;

      if (currentDisplayed === "Unknown") {
        // First initialization: accept immediately
        currentDisplayed = candidate;
        displayedDirectionRef.current = candidate;
        pendingCandidateRef.current = null;
      } else if (candidate === currentDisplayed) {
        // Consistent with currently displayed direction
        pendingCandidateRef.current = null;
      } else {
        // Candidate differs from current displayed direction
        if (pendingCandidateRef.current === candidate) {
          // Confirmed on 2 consecutive updates!
          currentDisplayed = candidate;
          displayedDirectionRef.current = candidate;
          pendingCandidateRef.current = null;
        } else {
          // First observation of new direction: hold previous displayed direction
          pendingCandidateRef.current = candidate;
        }
      }

      // 5. Weighted confidence scoring
      let ssRes = 0;
      for (let i = 0; i < n; i++) {
        const pred = meanD + weightedSlope * (tValues[i] - meanT);
        const err = dValues[i] - pred;
        ssRes += weights[i] * err * err;
      }

      let confidence: MotionConfidence = "low";
      if (currentDisplayed === "Steady") {
        const variance = sumW > 0 ? sumWDD / sumW : 0;
        if (variance < 2.5) confidence = "high";
        else if (variance < 6.0) confidence = "medium";
        else confidence = "low";
      } else {
        const r2 = sumWDD > 0.001 ? 1 - ssRes / sumWDD : 0;
        if (r2 >= 0.75 && n >= 3) {
          confidence = "high";
        } else if (r2 >= 0.5) {
          confidence = "medium";
        } else {
          confidence = "low";
        }
      }

      const activeResult = {
        direction: currentDisplayed,
        speedCmS: currentDisplayed === "Steady" ? 0 : speedCmS,
        confidence,
        slope: weightedSlope,
        sampleCount: n,
      };

      // Cache reading for up to 4 seconds of holding
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

    // 6. Samples became insufficient or echo temporarily lost:
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

    // 7. Hold period expired: transition to in-card placeholder state
    lastValidCalcRef.current = null;
    displayedDirectionRef.current = "Unknown";
    pendingCandidateRef.current = null;

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
