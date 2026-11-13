import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Make the card glow on hover */
  hover?: boolean;
}

/**
 * Glass-morphism styled card with subtle border and optional hover glow.
 * Inspired by Aceternity UI glass cards, adapted to Proximo dark theme.
 */
export function GlassCard({ children, className, hover = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5",
        "shadow-[0_0_15px_rgba(0,0,0,0.3)]",
        hover && [
          "transition-all duration-300",
          "hover:border-accent/20 hover:shadow-[0_0_25px_rgba(34,211,238,0.08)]",
        ],
        className
      )}
    >
      {children}
    </div>
  );
}

