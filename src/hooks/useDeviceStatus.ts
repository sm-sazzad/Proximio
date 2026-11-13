"use client";

import { useEffect, useState } from "react";
import { useLive } from "@/hooks/useLive";
import { useServerTimeOffset } from "@/hooks/useServerTimeOffset";

interface DeviceStatus {
  /** true if the last live.ts update was less than 10 seconds ago */
  online: boolean;
  /** seconds since the last live.ts update, or null if no data yet */
  secondsAgo: number | null;
}

/**
 * Returns whether the ESP32 device is online and how many seconds
 * ago the last update was. Recalculates every second using
 * Firebase's server time offset for accuracy.
 */
export function useDeviceStatus(): DeviceStatus {
  const live = useLive();
  const offset = useServerTimeOffset();
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  useEffect(() => {
    if (!live?.ts) {
      setSecondsAgo(null);
      return;
    }

    function calculate() {
      const serverNow = Date.now() + offset;
      const diff = Math.max(0, Math.floor((serverNow - live!.ts) / 1000));
      setSecondsAgo(diff);
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [live?.ts, offset]);

  const online = secondsAgo !== null && secondsAgo < 10;

  return { online, secondsAgo };
}

