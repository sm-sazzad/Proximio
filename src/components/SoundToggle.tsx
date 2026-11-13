"use client";

import { useAlertSound } from "@/context/AlertSoundContext";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function SoundToggle() {
  const { soundEnabled, toggleSound } = useAlertSound();

  return (
    <button
      type="button"
      onClick={toggleSound}
      className={cn(
        "relative flex items-center justify-center h-8 w-8 rounded-lg border text-xs font-mono transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        soundEnabled
          ? "border-accent/60 bg-accent/15 text-accent shadow-[0_0_12px_rgba(34,211,238,0.25)]"
          : "border-border/60 bg-white/[0.03] text-muted hover:text-text hover:border-border hover:bg-white/[0.06]"
      )}
      title={
        soundEnabled
          ? "Audible alerts: Enabled (click to mute)"
          : "Audible alerts: Disabled (click to enable)"
      }
      aria-label={
        soundEnabled
          ? "Audible alerts enabled. Click to mute."
          : "Audible alerts disabled. Click to enable."
      }
      aria-pressed={soundEnabled}
    >
      {soundEnabled ? (
        <>
          <Bell className="h-4 w-4 text-accent" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
        </>
      ) : (
        <BellOff className="h-4 w-4" />
      )}
    </button>
  );
}
