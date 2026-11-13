"use client";

import { useEffect, useState, useTransition } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { toast } from "sonner";
import { useControl } from "@/hooks/useControl";
import { useLive } from "@/hooks/useLive";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { GlassCard } from "@/components/GlassCard";
import { SectionHeader } from "@/components/SectionHeader";
import { Skeleton } from "@/components/Skeleton";
import { cn } from "@/lib/utils";
import {
  Sliders,
  Shield,
  ShieldAlert,
  ShieldOff,
  Volume2,
  VolumeX,
  WifiOff,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";

/** Quick selectable preset ranges */
const PRESETS = [
  { name: "Near", min: 10, max: 30 },
  { name: "Medium", min: 10, max: 50 },
  { name: "Wide", min: 10, max: 100 },
] as const;

export default function ControlPage() {
  const { control, updateControl } = useControl();
  const live = useLive();
  const { online } = useDeviceStatus();

  // Local draft state for threshold slider
  const [draftMin, setDraftMin] = useState<number>(10);
  const [draftMax, setDraftMax] = useState<number>(50);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Optimistic switch states
  const [optimisticArmed, setOptimisticArmed] = useState<boolean>(true);
  const [optimisticBuzzer, setOptimisticBuzzer] = useState<boolean>(true);
  const [, startTransition] = useTransition();

  // Sync draft state with Firebase saved values when they arrive or change externally
  useEffect(() => {
    if (!control) return;

    // Check if user has unsaved draft changes
    const hasUnsaved = draftMin !== control.minCm || draftMax !== control.maxCm;

    // If no unsaved changes, or on initial load, synchronize draft
    if (!hasUnsaved) {
      setDraftMin(control.minCm);
      setDraftMax(control.maxCm);
    }

    setOptimisticArmed(control.armed);
    setOptimisticBuzzer(control.buzzerEnabled);
  }, [control]);

  // Initial synchronization once control is first loaded
  useEffect(() => {
    if (control) {
      setDraftMin(control.minCm);
      setDraftMax(control.maxCm);
      setOptimisticArmed(control.armed);
      setOptimisticBuzzer(control.buzzerEnabled);
    }
  }, [control === null]);

  // If control data is loading
  if (!control) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 mt-2 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-44 rounded-xl" />
      </div>
    );
  }

  const hasUnsavedChanges =
    draftMin !== control.minCm || draftMax !== control.maxCm;

  // Handle Range Slider changes (enforcing minCm >= 2, maxCm <= 400, max - min >= 2)
  const handleSliderChange = ([newMin, newMax]: [number, number]) => {
    const clampedMin = Math.max(2, Math.min(newMin, 398));
    const clampedMax = Math.min(400, Math.max(newMax, clampedMin + 2));
    setDraftMin(clampedMin);
    setDraftMax(clampedMax);
  };

  // Handle Numeric Min Input
  const handleMinChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;
    const clamped = Math.max(2, Math.min(val, draftMax - 2));
    setDraftMin(clamped);
  };

  // Handle Numeric Max Input
  const handleMaxChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;
    const clamped = Math.min(400, Math.max(val, draftMin + 2));
    setDraftMax(clamped);
  };

  // Handle Quick Presets
  const applyPreset = (preset: { min: number; max: number }) => {
    setDraftMin(preset.min);
    setDraftMax(preset.max);
  };

  // Handle Reset Draft to Saved
  const handleReset = () => {
    setDraftMin(control.minCm);
    setDraftMax(control.maxCm);
  };

  // Handle Apply Thresholds to Firebase
  const handleApply = async () => {
    if (!hasUnsavedChanges || isSaving) return;

    // Strict validation rule: 0 <= minCm < maxCm <= 400 with integer numbers
    const validMin = Math.round(Math.max(2, Math.min(draftMin, 398)));
    const validMax = Math.round(Math.min(400, Math.max(draftMax, validMin + 2)));

    setIsSaving(true);
    try {
      await updateControl({
        minCm: validMin,
        maxCm: validMax,
      });
      toast.success("Saved. The device applies changes within about 3 s.");
    } catch {
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Arm/Disarm Switch with Optimistic UI & Rollback
  const handleArmedToggle = async (checked: boolean) => {
    const previous = optimisticArmed;
    startTransition(() => {
      setOptimisticArmed(checked);
    });

    try {
      await updateControl({ armed: Boolean(checked) });
      toast.success(checked ? "System armed." : "System disarmed.");
    } catch {
      startTransition(() => {
        setOptimisticArmed(previous);
      });
      toast.error("Failed to update arming status.");
    }
  };

  // Handle Buzzer Switch with Optimistic UI & Rollback
  const handleBuzzerToggle = async (checked: boolean) => {
    const previous = optimisticBuzzer;
    startTransition(() => {
      setOptimisticBuzzer(checked);
    });

    try {
      await updateControl({ buzzerEnabled: Boolean(checked) });
      toast.success(checked ? "Buzzer enabled." : "Buzzer muted.");
    } catch {
      startTransition(() => {
        setOptimisticBuzzer(previous);
      });
      toast.error("Failed to update buzzer sounder.");
    }
  };

  // Calculate live distance marker position on slider track (scale 2 to 400)
  const showLiveMarker =
    live?.distance !== undefined &&
    live.distance !== null &&
    live.distance >= 2 &&
    live.distance <= 400;

  const liveMarkerPct = showLiveMarker
    ? Math.max(0, Math.min(100, ((live.distance - 2) / (400 - 2)) * 100))
    : 0;

  const isLiveInDraftRange =
    showLiveMarker && live.distance >= draftMin && live.distance <= draftMax;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Device Control</h1>
          <p className="text-sm text-muted">Configure distance thresholds and alarm sounders</p>
        </div>

        {/* Sync Latency Notice */}
        <div className="flex items-center gap-1.5 text-xs text-muted font-mono bg-white/[0.02] border border-border/40 rounded-lg px-3 py-1.5 self-start sm:self-auto">
          <Info className="h-3.5 w-3.5 text-accent" />
          <span>ESP32 polling sync ~3s</span>
        </div>
      </div>

      {/* ── Device Offline Warning Banner ────────────────────────────── */}
      {!online && (
        <div
          className="rounded-xl border border-warning/40 bg-warning/10 p-3.5 text-warning flex items-center gap-3 text-xs sm:text-sm"
          role="status"
        >
          <WifiOff className="h-5 w-5 shrink-0 text-warning" />
          <p>
            <strong>Device is offline.</strong> Changes are saved in the cloud and will automatically apply when the device reconnects.
          </p>
        </div>
      )}

      {/* ── Top Bento Grid: Alert Range & Immediate Switches ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1) Alert Range Card (Large Bento 7 cols) */}
        <GlassCard hover className="lg:col-span-7 p-6 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionHeader
                title="Alert Trigger Range"
                icon={<Sliders className="h-4 w-4" />}
                className="mb-0"
              />
              {hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning border border-warning/30 animate-pulse">
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success border border-success/30">
                  <Check className="h-3 w-3" /> In sync
                </span>
              )}
            </div>
            <p className="text-xs text-muted">
              Objects detected between {draftMin} cm and {draftMax} cm will trigger an intrusion alarm.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider block">
              Quick Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const isSelected =
                  draftMin === preset.min && draftMax === preset.max;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      "min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold transition-all border",
                      isSelected
                        ? "bg-accent/15 text-accent border-accent/40 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                        : "bg-white/[0.03] text-muted border-border hover:text-text hover:bg-white/[0.06]"
                    )}
                  >
                    {preset.name} ({preset.min}–{preset.max} cm)
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dual-Handle Range Slider with Live Marker */}
          <div className="space-y-3 pt-2">
            <div className="relative pt-6 pb-2">
              <SliderPrimitive.Root
                min={2}
                max={400}
                step={1}
                minStepsBetweenThumbs={2}
                value={[draftMin, draftMax]}
                onValueChange={handleSliderChange}
                className="relative flex items-center select-none touch-none w-full h-8 cursor-pointer"
                aria-label="Alert distance range slider"
              >
                <SliderPrimitive.Track className="bg-white/10 relative grow rounded-full h-2.5 overflow-visible">
                  {/* Highlighted Alert Range Band */}
                  <SliderPrimitive.Range className="absolute bg-accent rounded-full h-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />

                  {/* Live Distance Marker Pip */}
                  {showLiveMarker && (
                    <div
                      style={{ left: `${liveMarkerPct}%` }}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center"
                    >
                      <span
                        className={cn(
                          "absolute -top-6 rounded px-1 py-0.5 text-[9px] font-mono font-bold whitespace-nowrap shadow-md border",
                          isLiveInDraftRange
                            ? "bg-danger/25 border-danger/80 text-danger"
                            : "bg-card border-accent/80 text-accent"
                        )}
                      >
                        Live: {live.distance}cm
                      </span>
                      <div
                        className={cn(
                          "h-4 w-1.5 rounded-full border border-bg shadow",
                          isLiveInDraftRange ? "bg-danger" : "bg-accent"
                        )}
                      />
                    </div>
                  )}
                </SliderPrimitive.Track>

                {/* Min Thumb */}
                <SliderPrimitive.Thumb
                  className="block w-5 h-5 bg-text rounded-full shadow-lg border-2 border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-transform hover:scale-110 active:scale-95"
                  aria-label="Minimum alert distance threshold in cm"
                />

                {/* Max Thumb */}
                <SliderPrimitive.Thumb
                  className="block w-5 h-5 bg-text rounded-full shadow-lg border-2 border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-transform hover:scale-110 active:scale-95"
                  aria-label="Maximum alert distance threshold in cm"
                />
              </SliderPrimitive.Root>

              <div className="flex justify-between text-[10px] text-muted font-mono mt-1">
                <span>2 cm</span>
                <span>100 cm</span>
                <span>200 cm</span>
                <span>300 cm</span>
                <span>400 cm</span>
              </div>
            </div>

            {/* Numeric Inputs (Synchronized) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="min-input" className="text-xs text-muted font-medium">
                    Min:
                  </label>
                  <input
                    id="min-input"
                    type="number"
                    min={2}
                    max={draftMax - 2}
                    step={1}
                    value={draftMin}
                    onChange={(e) => handleMinChange(e.target.value)}
                    className="w-20 rounded-lg border border-border bg-card px-2 py-2 text-sm font-mono text-text text-center focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
                  />
                  <span className="text-xs text-muted">cm</span>
                </div>

                <ArrowRight className="h-3.5 w-3.5 text-muted hidden sm:inline" />

                <div className="flex items-center gap-2">
                  <label htmlFor="max-input" className="text-xs text-muted font-medium">
                    Max:
                  </label>
                  <input
                    id="max-input"
                    type="number"
                    min={draftMin + 2}
                    max={400}
                    step={1}
                    value={draftMax}
                    onChange={(e) => handleMaxChange(e.target.value)}
                    className="w-20 rounded-lg border border-border bg-card px-2 py-2 text-sm font-mono text-text text-center focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
                  />
                  <span className="text-xs text-muted">cm</span>
                </div>
              </div>

              {/* Action Buttons: Apply & Reset */}
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isSaving}
                    className="min-h-[44px] px-3.5 py-2 rounded-lg border border-border text-xs font-medium text-muted hover:text-text hover:bg-white/[0.04] transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!hasUnsavedChanges || isSaving}
                  className={cn(
                    "min-h-[44px] px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg",
                    hasUnsavedChanges
                      ? "bg-accent text-bg hover:bg-accent/90 shadow-[0_0_20px_rgba(34,211,238,0.3)] active:scale-95"
                      : "bg-white/10 text-muted cursor-not-allowed opacity-60"
                  )}
                >
                  {isSaving ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-bg border-t-transparent animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Apply Range</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 2) Immediate Switches Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
          {/* Master Arm Switch */}
          <GlassCard hover className="p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
                    optimisticArmed
                      ? "bg-success/15 text-success shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                      : "bg-white/5 text-muted"
                  )}
                >
                  {optimisticArmed ? (
                    <Shield className="h-5 w-5" />
                  ) : (
                    <ShieldOff className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">System Monitoring</h3>
                  <p className="text-xs text-muted">
                    {optimisticArmed ? (
                      <span className="text-success font-semibold">Armed & Active</span>
                    ) : (
                      <span className="text-muted font-semibold">Standby (Disarmed)</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Large Switch (min 44px touch area) */}
              <div className="min-h-[44px] flex items-center">
                <SwitchPrimitive.Root
                  checked={optimisticArmed}
                  onCheckedChange={handleArmedToggle}
                  className={cn(
                    "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success",
                    optimisticArmed ? "bg-success" : "bg-white/15"
                  )}
                  aria-label="Toggle system arming status"
                >
                  <SwitchPrimitive.Thumb
                    className={cn(
                      "pointer-events-none block h-5 w-5 rounded-full bg-text shadow-lg ring-0 transition-transform",
                      optimisticArmed ? "translate-x-5 bg-bg" : "translate-x-0 bg-muted"
                    )}
                  />
                </SwitchPrimitive.Root>
              </div>
            </div>

            <p className="text-xs text-muted pt-2 border-t border-border/40">
              {optimisticArmed
                ? "The system is actively monitoring distance and will trigger alarms on breach."
                : "The system will not alarm."}
            </p>
          </GlassCard>

          {/* Buzzer Sounder Switch */}
          <GlassCard hover className="p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
                    optimisticBuzzer
                      ? "bg-accent/15 text-accent shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                      : "bg-white/5 text-muted"
                  )}
                >
                  {optimisticBuzzer ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">Hardware Buzzer</h3>
                  <p className="text-xs text-muted">
                    {optimisticBuzzer ? (
                      <span className="text-accent font-semibold">Buzzer Sounder On</span>
                    ) : (
                      <span className="text-muted font-semibold">Sounder Muted</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Large Switch (min 44px touch area) */}
              <div className="min-h-[44px] flex items-center">
                <SwitchPrimitive.Root
                  checked={optimisticBuzzer}
                  onCheckedChange={handleBuzzerToggle}
                  className={cn(
                    "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    optimisticBuzzer ? "bg-accent" : "bg-white/15"
                  )}
                  aria-label="Toggle hardware buzzer sounder"
                >
                  <SwitchPrimitive.Thumb
                    className={cn(
                      "pointer-events-none block h-5 w-5 rounded-full bg-text shadow-lg ring-0 transition-transform",
                      optimisticBuzzer ? "translate-x-5 bg-bg" : "translate-x-0 bg-muted"
                    )}
                  />
                </SwitchPrimitive.Root>
              </div>
            </div>

            <p className="text-xs text-muted pt-2 border-t border-border/40">
              When off, alerts still show but the buzzer stays silent.
            </p>
          </GlassCard>
        </div>
      </div>

      {/* ── Summary Card: Current Saved Settings in Cloud ──────────── */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            title="Current Saved Cloud Settings"
            icon={<Sparkles className="h-4 w-4 text-accent" />}
            className="mb-0"
          />
          <span className="text-xs font-mono text-muted">/control state</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Saved Range */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-border/40 space-y-1">
            <span className="text-xs text-muted block">Saved Trigger Range</span>
            <p className="text-xl font-bold font-mono text-text">
              {control.minCm} &mdash; {control.maxCm} <span className="text-xs text-muted">cm</span>
            </p>
            <p className="text-[11px] text-muted">
              Delta width: {control.maxCm - control.minCm} cm
            </p>
          </div>

          {/* Saved Sounder */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-border/40 space-y-1">
            <span className="text-xs text-muted block">Hardware Buzzer</span>
            <p
              className={cn(
                "text-xl font-bold",
                control.buzzerEnabled ? "text-accent" : "text-muted"
              )}
            >
              {control.buzzerEnabled ? "Enabled" : "Muted"}
            </p>
            <p className="text-[11px] text-muted">
              Physical active buzzer state
            </p>
          </div>

          {/* Saved System State */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-border/40 space-y-1">
            <span className="text-xs text-muted block">Master System State</span>
            <p
              className={cn(
                "text-xl font-bold",
                control.armed ? "text-success" : "text-muted"
              )}
            >
              {control.armed ? "Armed" : "Disarmed"}
            </p>
            <p className="text-[11px] text-muted">
              Intrusion monitoring trigger
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
