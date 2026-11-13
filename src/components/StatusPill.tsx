import { cn } from "@/lib/utils";
import type { Live } from "@/lib/types";

type Status = Live["status"];

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  safe: {
    label: "Safe",
    color: "text-success",
    bg: "bg-success/15",
  },
  alert: {
    label: "Alert",
    color: "text-danger",
    bg: "bg-danger/15",
  },
  nosensor: {
    label: "No Sensor",
    color: "text-warning",
    bg: "bg-warning/15",
  },
  disarmed: {
    label: "Disarmed",
    color: "text-muted",
    bg: "bg-muted/15",
  },
};

interface StatusPillProps {
  status: Status;
  className?: string;
}

/**
 * A small pill badge showing the current device status with color coding.
 * Uses color AND text label (never color alone, per accessibility rules).
 */
export function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        config.bg,
        config.color,
        className
      )}
      role="status"
      aria-label={`Device status: ${config.label}`}
    >
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          status === "alert" && "animate-pulse",
          // Use a solid dot in the status color
          status === "safe" && "bg-success",
          status === "alert" && "bg-danger",
          status === "nosensor" && "bg-warning",
          status === "disarmed" && "bg-muted"
        )}
      />
      {config.label}
    </span>
  );
}

