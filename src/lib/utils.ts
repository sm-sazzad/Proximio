import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely — combines clsx + tailwind-merge */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shared time formatting helper for relative timestamps.
 * - under 60 s: "12s ago"
 * - under 1 hour: "5m ago"
 * - under 24 hours: "3h 14m ago"
 * - otherwise: "2d 5h ago"
 */
export function formatAgo(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return "just now";
  }

  const s = Math.max(0, Math.floor(seconds));

  if (s < 60) {
    return `${s}s ago`;
  }

  const minutes = Math.floor(s / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) {
    return remMinutes > 0 ? `${hours}h ${remMinutes}m ago` : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h ago` : `${days}d ago`;
}
