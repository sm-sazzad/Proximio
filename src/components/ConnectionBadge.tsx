import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";

interface ConnectionBadgeProps {
  className?: string;
}

/**
 * Shows the device online/offline status with an icon, label,
 * and "updated Xs ago" text.
 */
export function ConnectionBadge({ className }: ConnectionBadgeProps) {
  const { online, secondsAgo } = useDeviceStatus();

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="status"
      aria-label={online ? "Device is online" : "Device is offline"}
    >
      {online ? (
        <Wifi className="h-4 w-4 text-success" />
      ) : (
        <WifiOff className="h-4 w-4 text-danger" />
      )}
      <span
        className={cn(
          "text-xs font-medium",
          online ? "text-success" : "text-danger"
        )}
      >
        {online ? "Online" : "Offline"}
      </span>
      {secondsAgo !== null && (
        <span className="text-xs text-muted hidden sm:inline">
          · {secondsAgo}s ago
        </span>
      )}
    </div>
  );
}

