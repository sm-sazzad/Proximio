import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Main heading */
  title: string;
  /** Supporting description */
  description?: string;
  /** Custom icon (defaults to Inbox) */
  icon?: ReactNode;
  /** Optional action element, e.g. a button */
  action?: ReactNode;
  className?: string;
}

/**
 * Shown when a section has no data to display.
 * Centered layout with icon, title, and optional description/action.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      <div className="mb-4 text-muted">
        {icon ?? <Inbox className="h-10 w-10" />}
      </div>
      <h3 className="text-base font-semibold text-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

