"use client";

import { useControl } from "@/hooks/useControl";
import { GlassCard } from "@/components/GlassCard";
import { StatCard } from "@/components/StatCard";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { Sliders, Volume2, Shield, ArrowDownUp, Sparkles } from "lucide-react";

export default function ControlPage() {
  const { control } = useControl();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Device Control</h1>
        <p className="text-sm text-muted">Configure distance thresholds and alarm triggers</p>
      </div>

      {/* Control Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {control ? (
          <>
            <StatCard
              label="Min Threshold"
              value={`${control.minCm} cm`}
              icon={<ArrowDownUp className="h-4 w-4" />}
              subtitle="Alert lower bound"
            />
            <StatCard
              label="Max Threshold"
              value={`${control.maxCm} cm`}
              icon={<ArrowDownUp className="h-4 w-4" />}
              subtitle="Alert upper bound"
            />
            <StatCard
              label="Buzzer"
              value={control.buzzerEnabled ? "Enabled" : "Muted"}
              icon={<Volume2 className="h-4 w-4" />}
              subtitle="Hardware sounder"
            />
            <StatCard
              label="System State"
              value={control.armed ? "Armed" : "Disarmed"}
              icon={<Shield className="h-4 w-4" />}
              subtitle="Monitoring mode"
            />
          </>
        ) : (
          <>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </>
        )}
      </div>

      {/* Step 5 Placeholder */}
      <GlassCard hover className="p-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/30 shadow-[0_0_25px_rgba(34,211,238,0.2)]">
            <Sliders className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent ring-1 ring-inset ring-accent/20">
              Coming in Step 5
            </span>
            <h2 className="text-xl font-semibold text-text">Interactive Threshold Controls</h2>
            <p className="text-sm text-muted max-w-xl">
              Dual-handle slider for precision range adjustments, hardware buzzer toggle, master arm/disarm switch, and real-time ESP32 sync indicators.
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <SectionHeader title="Configuration Overview" />
        <EmptyState
          title="Controls locked in Step 2"
          description="Interactive sliders and input controls will be hooked up to Firebase in Step 5."
          icon={<Sparkles className="h-8 w-8 text-accent" />}
        />
      </GlassCard>
    </div>
  );
}

