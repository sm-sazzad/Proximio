"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLive } from "@/hooks/useLive";
import { useServerTimeOffset } from "@/hooks/useServerTimeOffset";
import type { Live } from "@/lib/types";

export interface DistanceSample {
  /** Timestamp in ms (aligned with server-corrected timeline) */
  timestamp: number;
  /** Raw server timestamp from live.ts */
  rawTs: number;
  /** Distance in cm, or null if -1 (no echo / gap) */
  distance: number | null;
  /** Device status at time of sample */
  status: Live["status"];
}

const DistanceBufferContext = createContext<DistanceSample[]>([]);

// 5 minutes in milliseconds
const MAX_BUFFER_WINDOW_MS = 5 * 60 * 1000;

export function DistanceBufferProvider({ children }: { children: ReactNode }) {
  const live = useLive();
  const offset = useServerTimeOffset();
  const [samples, setSamples] = useState<DistanceSample[]>([]);
  const lastRecordedTs = useRef<number | null>(null);

  useEffect(() => {
    if (!live || !live.ts) return;

    // Deduplicate by live.ts
    if (lastRecordedTs.current === live.ts) return;
    lastRecordedTs.current = live.ts;

    // Server-corrected timestamp for this sample
    // Since live.ts is a server timestamp, it directly reflects server time
    const sampleTimestamp = live.ts;

    const newSample: DistanceSample = {
      timestamp: sampleTimestamp,
      rawTs: live.ts,
      distance: live.distance === -1 ? null : live.distance,
      status: live.status,
    };

    setSamples((prev) => {
      const serverNow = Date.now() + offset;
      const cutoff = serverNow - MAX_BUFFER_WINDOW_MS;

      // Append new sample and drop samples older than 5 minutes
      const updated = [...prev, newSample].filter(
        (s) => s.timestamp >= cutoff
      );
      return updated;
    });
  }, [live, offset]);

  return (
    <DistanceBufferContext value={samples}>
      {children}
    </DistanceBufferContext>
  );
}

/**
 * Access the persistent 5-minute rolling distance buffer.
 * Mounted at app level so it collects across route changes without reset.
 */
export function useDistanceBuffer(): DistanceSample[] {
  return useContext(DistanceBufferContext);
}

