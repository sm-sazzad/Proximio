import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * A shimmering placeholder skeleton for loading states.
 * Uses a subtle animation with the card/muted colors.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-card animate-pulse",
        className
      )}
      aria-hidden="true"
    />
  );
}

