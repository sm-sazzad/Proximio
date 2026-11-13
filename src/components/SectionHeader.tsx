import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  /** Optional icon to show before the title */
  icon?: ReactNode;
  /** Optional text or element on the right side */
  action?: ReactNode;
  className?: string;
}

/**
 * A section header with title, optional icon and optional right-side action.
 */
export function SectionHeader({ title, icon, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-accent">{icon}</span>}
        <h2 className="text-lg font-semibold text-text">{title}</h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

