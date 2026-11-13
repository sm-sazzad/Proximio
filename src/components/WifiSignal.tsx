import { cn } from "@/lib/utils";

interface WifiSignalProps {
  rssi: number;
  className?: string;
}

/**
 * WiFi signal bars derived from RSSI:
 * >= -55: 4 bars (Excellent)
 * -56 to -67: 3 bars (Good)
 * -68 to -80: 2 bars (Fair)
 * < -80: 1 bar (Weak)
 */
export function WifiSignal({ rssi, className }: WifiSignalProps) {
  let bars = 1;
  let label = "Weak";

  if (rssi >= -55) {
    bars = 4;
    label = "Excellent";
  } else if (rssi >= -67) {
    bars = 3;
    label = "Good";
  } else if (rssi >= -80) {
    bars = 2;
    label = "Fair";
  } else {
    bars = 1;
    label = "Weak";
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* 4-bar indicator */}
      <div className="flex items-end gap-0.5 h-4 w-5" aria-hidden="true">
        <span
          className={cn(
            "w-1 rounded-sm transition-colors",
            bars >= 1 ? "bg-accent h-1.5" : "bg-white/10 h-1.5"
          )}
        />
        <span
          className={cn(
            "w-1 rounded-sm transition-colors",
            bars >= 2 ? "bg-accent h-2.5" : "bg-white/10 h-2.5"
          )}
        />
        <span
          className={cn(
            "w-1 rounded-sm transition-colors",
            bars >= 3 ? "bg-accent h-3.5" : "bg-white/10 h-3.5"
          )}
        />
        <span
          className={cn(
            "w-1 rounded-sm transition-colors",
            bars >= 4 ? "bg-accent h-4" : "bg-white/10 h-4"
          )}
        />
      </div>

      <div className="flex flex-col">
        <span className="text-xs font-semibold text-text">{rssi} dBm</span>
        <span className="text-[10px] text-muted">{label}</span>
      </div>
    </div>
  );
}
