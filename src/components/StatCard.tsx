import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";
import type { ReactNode } from "react";

interface StatCardProps {
  /** Label above the value */
  label: string;
  /** The main big value to display */
  value: string;
  /** Optional icon to the left of the label */
  icon?: ReactNode;
  /** Optional small text below the value */
  subtitle?: string;
  className?: string;
}

/**
 * A card that highlights a single stat with a big number.
 * Uses GlassCard as the base.
 */
export function StatCard({ label, value, icon, subtitle, className }: StatCardProps) {
  return (
    <GlassCard hover className={className}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-accent">{icon}</span>}
        <span className="text-sm text-muted font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text tracking-tight">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted mt-1">{subtitle}</p>
      )}
    </GlassCard>
  );
}

