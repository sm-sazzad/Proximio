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
  RotateCw,
  Sparkles,
  ArrowRight,
  Info,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

/** Quick selectable preset ranges for alert */
const PRESETS = [
  { name: "Near", min: 10, max: 30 },
  { name: "Medium", min: 10, max: 50 },
  { name: "Wide", min: 10, max: 100 },
] as const;

/** Servo default values when fields are unconfigured in Firebase */
const DEFAULT_SERVO_MIN = 5;
const DEFAULT_SERVO_MAX = 10;
const DEFAULT_SERVO_ANGLE = 90;

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
  const [optimisticLed, setOptimisticLed] = useState<boolean>(false);
  const [optimisticServoEnabled, setOptimisticServoEnabled] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  // Local draft state for servo motor
  const [draftServoMin, setDraftServoMin] = useState<number>(DEFAULT_SERVO_MIN);
  const [draftServoMax, setDraftServoMax] = useState<number>(DEFAULT_SERVO_MAX);
  const [draftServoAngle, setDraftServoAngle] = useState<number>(DEFAULT_SERVO_ANGLE);
  const [isSavingServo, setIsSavingServo] = useState<boolean>(false);

  // Saved servo values for comparison and display
  const savedServoMin = control?.servoMinCm ?? DEFAULT_SERVO_MIN;
  const savedServoMax = control?.servoMaxCm ?? DEFAULT_SERVO_MAX;
  const savedServoAngle = control?.servoAngle ?? DEFAULT_SERVO_ANGLE;

  // Stored validity check for servo
  const isStoredServoInvalid = Boolean(
    control &&
      ((control.servoMinCm !== undefined && control.servoMinCm < 2) ||
        (control.servoMaxCm !== undefined && control.servoMaxCm > 400) ||
        (control.servoMinCm !== undefined &&
          control.servoMaxCm !== undefined &&
          control.servoMinCm >= control.servoMaxCm) ||
        (control.servoAngle !== undefined &&
          (control.servoAngle < 10 || control.servoAngle > 180))),
  );

  // Sync draft state with Firebase saved values when they arrive or change externally
  useEffect(() => {
    if (!control) return;

    // Check if user has unsaved draft changes for alert thresholds
    const hasUnsavedAlert = draftMin !== control.minCm || draftMax !== control.maxCm;
    if (!hasUnsavedAlert) {
      setDraftMin(control.minCm);
      setDraftMax(control.maxCm);
    }

    // Check if user has unsaved draft changes for servo
    const sMin = control.servoMinCm ?? DEFAULT_SERVO_MIN;
    const sMax = control.servoMaxCm ?? DEFAULT_SERVO_MAX;
    const sAngle = control.servoAngle ?? DEFAULT_SERVO_ANGLE;

    const hasUnsavedServo =
      draftServoMin !== sMin ||
      draftServoMax !== sMax ||
      draftServoAngle !== sAngle;

    if (!hasUnsavedServo) {
      // Clamping to nearest valid values if stored was out of bounds
      const validMin = Math.max(2, Math.min(398, sMin));
      const validMax = Math.max(validMin + 2, Math.min(400, sMax));
      const validAngle = Math.max(10, Math.min(180, sAngle));

      setDraftServoMin(validMin);
      setDraftServoMax(validMax);
      setDraftServoAngle(validAngle);
    }

    setOptimisticArmed(control.armed);
    setOptimisticBuzzer(control.buzzerEnabled);
    setOptimisticLed(Boolean(control.ledOn));
    setOptimisticServoEnabled(Boolean(control.servoEnabled));
  }, [control]);

  // Initial synchronization once control is first loaded
  useEffect(() => {
    if (control) {
      setDraftMin(control.minCm);
      setDraftMax(control.maxCm);
      setOptimisticArmed(control.armed);
      setOptimisticBuzzer(control.buzzerEnabled);
      setOptimisticLed(Boolean(control.ledOn));

      const sMin = control.servoMinCm ?? DEFAULT_SERVO_MIN;
      const sMax = control.servoMaxCm ?? DEFAULT_SERVO_MAX;
      const sAngle = control.servoAngle ?? DEFAULT_SERVO_ANGLE;

      const validMin = Math.max(2, Math.min(398, sMin));
      const validMax = Math.max(validMin + 2, Math.min(400, sMax));
      const validAngle = Math.max(10, Math.min(180, sAngle));

      setDraftServoMin(validMin);
      setDraftServoMax(validMax);
      setDraftServoAngle(validAngle);
      setOptimisticServoEnabled(Boolean(control.servoEnabled));
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Skeleton className="lg:col-span-4 h-64 rounded-xl" />
          <Skeleton className="lg:col-span-8 h-80 rounded-xl" />
        </div>
        <Skeleton className="h-44 rounded-xl" />
      </div>
    );
  }

  const hasUnsavedChanges =
    draftMin !== control.minCm || draftMax !== control.maxCm;

  const hasUnsavedServoChanges =
    draftServoMin !== savedServoMin ||
    draftServoMax !== savedServoMax ||
    draftServoAngle !== savedServoAngle;

  // Check if remotely stored Firebase range violates firmware constraints (2 <= min < max <= 400)
  const isStoredRangeInvalid =
    control.minCm < 2 ||
    control.maxCm > 400 ||
    control.minCm >= control.maxCm;

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
    const validMax = Math.round(
      Math.min(400, Math.max(draftMax, validMin + 2)),
    );

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

  // Handle LED Light Switch with Optimistic UI & Rollback
  const handleLedToggle = async (checked: boolean) => {
    const previous = optimisticLed;
    const nextVal = Boolean(checked);
    startTransition(() => {
      setOptimisticLed(nextVal);
    });

    try {
      await updateControl({ ledOn: nextVal });
      toast.success("Saved. The device applies changes within about 3 s.");
    } catch {
      startTransition(() => {
        setOptimisticLed(previous);
      });
      toast.error("Failed to update LED light state.");
    }
  };

  // Handle Servo Range Slider changes (enforcing minCm >= 2, maxCm <= 400, max - min >= 2)
  const handleServoSliderChange = ([newMin, newMax]: [number, number]) => {
    const clampedMin = Math.max(2, Math.min(newMin, 398));
    const clampedMax = Math.min(400, Math.max(newMax, clampedMin + 2));
    setDraftServoMin(clampedMin);
    setDraftServoMax(clampedMax);
  };

  // Handle Numeric Servo Min Input
  const handleServoMinChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;
    const clamped = Math.max(2, Math.min(val, draftServoMax - 2));
    setDraftServoMin(clamped);
  };

  // Handle Numeric Servo Max Input
  const handleServoMaxChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;
    const clamped = Math.min(400, Math.max(val, draftServoMin + 2));
    setDraftServoMax(clamped);
  };

  // Handle Servo Angle Slider & Input changes (10 to 180 degrees)
  const handleServoAngleChange = ([newAngle]: [number]) => {
    const clamped = Math.max(10, Math.min(180, newAngle));
    setDraftServoAngle(clamped);
  };

  const handleServoAngleInputChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;
    const clamped = Math.max(10, Math.min(180, val));
    setDraftServoAngle(clamped);
  };

  // Reset Servo draft to saved values
  const handleResetServo = () => {
    setDraftServoMin(savedServoMin);
    setDraftServoMax(savedServoMax);
    setDraftServoAngle(savedServoAngle);
  };

  // Apply Servo range and angle changes to Firebase
  const handleApplyServo = async () => {
    setIsSavingServo(true);
    try {
      await updateControl({
        servoMinCm: Math.round(draftServoMin),
        servoMaxCm: Math.round(draftServoMax),
        servoAngle: Math.round(draftServoAngle),
      });
      toast.success("Saved. The device applies changes within about 3 s.");
    } catch {
      toast.error("Failed to update servo settings.");
    } finally {
      setIsSavingServo(false);
    }
  };

  // Handle Servo Enable Switch with Optimistic UI & Rollback
  const handleServoToggle = async (checked: boolean) => {
    const previous = optimisticServoEnabled;
    const nextVal = Boolean(checked);
    startTransition(() => {
      setOptimisticServoEnabled(nextVal);
    });

    try {
      await updateControl({ servoEnabled: nextVal });
      toast.success("Saved. The device applies changes within about 3 s.");
    } catch {
      startTransition(() => {
        setOptimisticServoEnabled(previous);
      });
      toast.error("Failed to update servo motor state.");
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

  const isLiveInServoDraftRange =
    showLiveMarker &&
    live.distance >= draftServoMin &&
    live.distance <= draftServoMax;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Device Control
          </h1>
          <p className="text-sm text-muted">
            Configure distance thresholds and alarm sounders
          </p>
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
            <strong>Device is offline.</strong> Changes are saved in the cloud
            and will automatically apply when the device reconnects.
          </p>
        </div>
      )}

      {/* ── Stored Invalid Range Warning Banner (Out of Bounds) ────── */}
      {isStoredRangeInvalid && (
        <div
          className="rounded-xl border border-warning/50 bg-warning/15 p-4 text-warning flex items-start gap-3 text-xs sm:text-sm"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              Stored Alert Range Out of Bounds
            </p>
            <p className="text-warning/90">
              Current stored values in Firebase are <strong>min: {control.minCm} cm</strong> and <strong>max: {control.maxCm} cm</strong>, which violate the device operational constraints (2 to 400 cm, with min &lt; max). The ESP32 firmware ignores invalid settings. Adjust below to valid thresholds and click Apply.
            </p>
          </div>
        </div>
      )}

      {/* ── Top Bento Grid: Alert Range & Immediate Switches ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1) Alert Range Card (Large Bento 7 cols) */}
        <GlassCard
          hover
          className="lg:col-span-7 p-6 space-y-6 flex flex-col justify-between"
        >
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
              Objects detected between {draftMin} cm and {draftMax} cm will
              trigger an intrusion alarm.
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
                        : "bg-white/[0.03] text-muted border-border hover:text-text hover:bg-white/[0.06]",
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
                            : "bg-card border-accent/80 text-accent",
                        )}
                      >
                        Live: {live.distance}cm
                      </span>
                      <div
                        className={cn(
                          "h-4 w-1.5 rounded-full border border-bg shadow",
                          isLiveInDraftRange ? "bg-danger" : "bg-accent",
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
                  <label
                    htmlFor="min-input"
                    className="text-xs text-muted font-medium"
                  >
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
                  <label
                    htmlFor="max-input"
                    className="text-xs text-muted font-medium"
                  >
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
                      : "bg-white/10 text-muted cursor-not-allowed opacity-60",
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
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Master Arm Switch */}
          <GlassCard hover className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
                    optimisticArmed
                      ? "bg-success/15 text-success shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                      : "bg-white/5 text-muted",
                  )}
                >
                  {optimisticArmed ? (
                    <Shield className="h-5 w-5" />
                  ) : (
                    <ShieldOff className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">
                    System Monitoring
                  </h3>
                  <p className="text-xs text-muted">
                    {optimisticArmed ? (
                      <span className="text-success font-semibold">
                        Armed & Active
                      </span>
                    ) : (
                      <span className="text-muted font-semibold">
                        Standby (Disarmed)
                      </span>
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
                    optimisticArmed ? "bg-success" : "bg-white/15",
                  )}
                  aria-label="Toggle system arming status"
                >
                  <SwitchPrimitive.Thumb
                    className={cn(
                      "pointer-events-none block h-5 w-5 rounded-full bg-text shadow-lg ring-0 transition-transform",
                      optimisticArmed
                        ? "translate-x-5 bg-bg"
                        : "translate-x-0 bg-muted",
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
          <GlassCard hover className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
                    optimisticBuzzer
                      ? "bg-accent/15 text-accent shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                      : "bg-white/5 text-muted",
                  )}
                >
                  {optimisticBuzzer ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">
                    Hardware Buzzer
                  </h3>
                  <p className="text-xs text-muted">
                    {optimisticBuzzer ? (
                      <span className="text-accent font-semibold">
                        Buzzer Sounder On
                      </span>
                    ) : (
                      <span className="text-muted font-semibold">
                        Sounder Muted
                      </span>
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
                    optimisticBuzzer ? "bg-accent" : "bg-white/15",
                  )}
                  aria-label="Toggle hardware buzzer sounder"
                >
                  <SwitchPrimitive.Thumb
                    className={cn(
                      "pointer-events-none block h-5 w-5 rounded-full bg-text shadow-lg ring-0 transition-transform",
                      optimisticBuzzer
                        ? "translate-x-5 bg-bg"
                        : "translate-x-0 bg-muted",
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

      {/* ── Auxiliary Controls Row: LED Light (narrower) & Servo Motor (wider) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── LED Light Card (lg:col-span-4) ── */}
        <GlassCard
          hover
          className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between space-y-5 relative overflow-hidden"
        >
          {/* Ambient background glow when LED is ON */}
          {optimisticLed && (
            <div
              className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/15 rounded-full blur-3xl pointer-events-none motion-reduce:hidden"
              aria-hidden="true"
            />
          )}

          {/* Top Header */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
                    optimisticLed
                      ? "bg-accent/15 text-accent shadow-[0_0_15px_rgba(34,211,238,0.3)] motion-reduce:shadow-none"
                      : "bg-white/5 text-muted",
                  )}
                >
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">LED Light</h3>
                  <p className="text-xs text-muted">
                    {optimisticLed ? (
                      <span className="text-accent font-semibold">ON</span>
                    ) : (
                      <span className="text-muted font-semibold">OFF</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Large Switch (min 44px touch area) */}
              <div className="min-h-[44px] flex items-center">
                <SwitchPrimitive.Root
                  checked={optimisticLed}
                  onCheckedChange={handleLedToggle}
                  className={cn(
                    "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    optimisticLed ? "bg-accent" : "bg-white/15",
                  )}
                  aria-label="Toggle LED"
                >
                  <SwitchPrimitive.Thumb
                    className={cn(
                      "pointer-events-none block h-5 w-5 rounded-full bg-text shadow-lg ring-0 transition-transform",
                      optimisticLed
                        ? "translate-x-5 bg-bg"
                        : "translate-x-0 bg-muted",
                    )}
                  />
                </SwitchPrimitive.Root>
              </div>
            </div>

            <p className="text-xs text-muted">
              Turn the LED on or off from anywhere. It is independent of the distance sensor, buzzer and alarm.
            </p>
          </div>

          {/* Center Stage: Interactive Lamp Beacon Visualizer */}
          <div className="flex flex-col items-center justify-center py-4 relative z-10">
            {/* Clickable Illuminating Orb */}
            <button
              type="button"
              onClick={() => handleLedToggle(!optimisticLed)}
              className={cn(
                "relative group flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer",
                optimisticLed
                  ? "p-6 bg-accent/10 border-2 border-accent shadow-[0_0_40px_rgba(34,211,238,0.4)]"
                  : "p-6 bg-white/[0.02] border-2 border-border/60 hover:border-accent/40 hover:bg-white/[0.04]",
              )}
              aria-label={optimisticLed ? "Turn LED light OFF" : "Turn LED light ON"}
            >
              {/* Radial pulse waves when ON */}
              {optimisticLed && (
                <div
                  className="absolute inset-0 rounded-full border border-accent/40 animate-ping pointer-events-none motion-reduce:hidden"
                  aria-hidden="true"
                />
              )}

              {/* Main Glowing Lightbulb Icon */}
              <Lightbulb
                className={cn(
                  "h-12 w-12 transition-all duration-300",
                  optimisticLed
                    ? "text-accent fill-accent filter drop-shadow-[0_0_16px_rgba(34,211,238,0.8)] scale-110"
                    : "text-muted/40 fill-transparent scale-100 group-hover:text-muted/70",
                )}
              />
            </button>

            {/* Quick status pill below orb */}
            <div className="mt-3 text-center space-y-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-colors",
                  optimisticLed
                    ? "bg-accent/15 text-accent border-accent/40 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    : "bg-white/[0.03] text-muted border-border/50",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    optimisticLed ? "bg-accent animate-pulse" : "bg-muted/40",
                  )}
                />
                {optimisticLed ? "ILLUMINATING" : "STANDBY"}
              </span>
              <p className="text-[11px] text-muted/70 font-mono">
                Click lamp to toggle
              </p>
            </div>
          </div>

          {/* Micro Telemetry Specs (fills vertical space symmetrically) */}
          <div className="pt-3 border-t border-border/40 grid grid-cols-2 gap-2 text-center text-xs font-mono">
            <div className="p-2 rounded-lg bg-white/[0.02] border border-border/30">
              <span className="text-[10px] text-muted block uppercase">Logic Level</span>
              <span
                className={cn(
                  "font-bold text-[11px]",
                  optimisticLed ? "text-accent" : "text-muted",
                )}
              >
                {optimisticLed ? "HIGH (3.3V)" : "LOW (0.0V)"}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.02] border border-border/30">
              <span className="text-[10px] text-muted block uppercase">Channel</span>
              <span className="text-text font-bold text-[11px]">GPIO Output</span>
            </div>
          </div>
        </GlassCard>

        {/* ── Servo Motor Card (lg:col-span-8) ── */}
        <GlassCard hover className="lg:col-span-8 p-5 sm:p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Header: Icon, Title, Status, Badges & Switch */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
                    optimisticServoEnabled
                      ? "bg-accent/15 text-accent shadow-[0_0_15px_rgba(34,211,238,0.3)] motion-reduce:shadow-none"
                      : "bg-white/5 text-muted",
                  )}
                >
                  <RotateCw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">Servo Motor</h3>
                  <p className="text-xs text-muted">
                    {optimisticServoEnabled ? (
                      <span className="text-accent font-semibold">Enabled</span>
                    ) : (
                      <span className="text-muted font-semibold">Disabled</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {hasUnsavedServoChanges ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning border border-warning/30 animate-pulse">
                    Unsaved changes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success border border-success/30">
                    <Check className="h-3 w-3" /> In sync
                  </span>
                )}

                {/* Large Switch (min 44px touch area) */}
                <div className="min-h-[44px] flex items-center">
                  <SwitchPrimitive.Root
                    checked={optimisticServoEnabled}
                    onCheckedChange={handleServoToggle}
                    className={cn(
                      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      optimisticServoEnabled ? "bg-accent" : "bg-white/15",
                    )}
                    aria-label="Toggle servo motor enabled"
                  >
                    <SwitchPrimitive.Thumb
                      className={cn(
                        "pointer-events-none block h-5 w-5 rounded-full bg-text shadow-lg ring-0 transition-transform",
                        optimisticServoEnabled
                          ? "translate-x-5 bg-bg"
                          : "translate-x-0 bg-muted",
                      )}
                    />
                  </SwitchPrimitive.Root>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted">
              Servo turns when the distance is inside this range and returns to 0 degrees when it leaves. Independent of the alarm range.
            </p>

            {/* Stored Invalid Warning Banner */}
            {isStoredServoInvalid && (
              <div
                className="rounded-xl border border-warning/50 bg-warning/15 p-3 text-warning flex items-start gap-2.5 text-xs"
                role="alert"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
                <p>
                  <strong>Stored values outside limits:</strong> Device ignores invalid values and keeps previous settings (requires min &ge; 2 cm, min &lt; max &le; 400 cm, angle 10°–180°). Adjust below and click Apply.
                </p>
              </div>
            )}

            {/* 1) Trigger Range Section */}
            <div className="space-y-3 pt-1">
              <span className="text-[11px] font-medium text-muted uppercase tracking-wider block">
                1. Trigger Range ({draftServoMin}–{draftServoMax} cm)
              </span>

              <div className="relative pt-6 pb-2">
                <SliderPrimitive.Root
                  min={2}
                  max={400}
                  step={1}
                  minStepsBetweenThumbs={2}
                  value={[draftServoMin, draftServoMax]}
                  onValueChange={handleServoSliderChange}
                  className="relative flex items-center select-none touch-none w-full h-8 cursor-pointer"
                  aria-label="Servo distance trigger range slider"
                >
                  <SliderPrimitive.Track className="bg-white/10 relative grow rounded-full h-2.5 overflow-visible">
                    {/* Highlighted Servo Range Band */}
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
                            isLiveInServoDraftRange
                              ? "bg-accent/25 border-accent text-accent font-bold"
                              : "bg-card border-border text-muted",
                          )}
                        >
                          Live: {live.distance}cm
                        </span>
                        <div
                          className={cn(
                            "h-4 w-1.5 rounded-full border border-bg shadow",
                            isLiveInServoDraftRange ? "bg-accent" : "bg-muted/60",
                          )}
                        />
                      </div>
                    )}
                  </SliderPrimitive.Track>

                  {/* Min Thumb */}
                  <SliderPrimitive.Thumb
                    className="block w-5 h-5 bg-text rounded-full shadow-lg border-2 border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-transform hover:scale-110 active:scale-95"
                    aria-label="Minimum servo distance threshold in cm"
                  />

                  {/* Max Thumb */}
                  <SliderPrimitive.Thumb
                    className="block w-5 h-5 bg-text rounded-full shadow-lg border-2 border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-transform hover:scale-110 active:scale-95"
                    aria-label="Maximum servo distance threshold in cm"
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
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="servo-min-input"
                    className="text-xs text-muted font-medium"
                  >
                    Min:
                  </label>
                  <input
                    id="servo-min-input"
                    type="number"
                    min={2}
                    max={draftServoMax - 2}
                    value={draftServoMin}
                    onChange={(e) => handleServoMinChange(e.target.value)}
                    className="w-20 rounded-lg border border-border bg-card px-2 py-2 text-sm font-mono text-text text-center focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
                  />
                  <span className="text-xs text-muted">cm</span>
                </div>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="servo-max-input"
                    className="text-xs text-muted font-medium"
                  >
                    Max:
                  </label>
                  <input
                    id="servo-max-input"
                    type="number"
                    min={draftServoMin + 2}
                    max={400}
                    value={draftServoMax}
                    onChange={(e) => handleServoMaxChange(e.target.value)}
                    className="w-20 rounded-lg border border-border bg-card px-2 py-2 text-sm font-mono text-text text-center focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
                  />
                  <span className="text-xs text-muted">cm</span>
                </div>
              </div>
            </div>

            {/* 2) Turn Angle Section */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <span className="text-[11px] font-medium text-muted uppercase tracking-wider block">
                2. Turn Angle ({draftServoAngle}°)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Dial Preview */}
                <div className="sm:col-span-4 flex items-center gap-3 bg-white/[0.02] border border-border/40 rounded-xl p-3">
                  <svg
                    width="60"
                    height="34"
                    viewBox="0 0 64 36"
                    className="shrink-0 overflow-visible"
                    aria-hidden="true"
                  >
                    {/* Background Arc 0° to 180° */}
                    <path
                      d="M 8,32 A 24,24 0 0,1 56,32"
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Active Arc from 0 deg (left) to draftServoAngle */}
                    <path
                      d={`M 8,32 A 24,24 0 0,1 ${
                        32 - 24 * Math.cos((draftServoAngle * Math.PI) / 180)
                      },${
                        32 - 24 * Math.sin((draftServoAngle * Math.PI) / 180)
                      }`}
                      fill="none"
                      stroke="#22D3EE"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Needle Line */}
                    <line
                      x1="32"
                      y1="32"
                      x2={32 - 20 * Math.cos((draftServoAngle * Math.PI) / 180)}
                      y2={32 - 20 * Math.sin((draftServoAngle * Math.PI) / 180)}
                      stroke="#22D3EE"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="32" cy="32" r="3" fill="#0A0F1C" stroke="#22D3EE" strokeWidth="1.5" />
                  </svg>
                  <div className="text-xs min-w-0">
                    <span className="text-[10px] uppercase font-mono text-muted tracking-wider block truncate">
                      Position
                    </span>
                    <span className="text-sm font-bold font-mono text-accent">
                      {draftServoAngle}°
                    </span>
                    <span className="text-[10px] text-muted block truncate">
                      Rest: 0°
                    </span>
                  </div>
                </div>

                {/* Slider & Presets Column */}
                <div className="sm:col-span-8 space-y-3">
                  <div className="flex items-center gap-3">
                    <SliderPrimitive.Root
                      min={10}
                      max={180}
                      step={1}
                      value={[draftServoAngle]}
                      onValueChange={handleServoAngleChange}
                      className="relative flex items-center select-none touch-none w-full h-8 cursor-pointer"
                      aria-label="Servo turn angle slider"
                    >
                      <SliderPrimitive.Track className="bg-white/10 relative grow rounded-full h-2 overflow-hidden">
                        <SliderPrimitive.Range className="absolute bg-accent rounded-full h-full" />
                      </SliderPrimitive.Track>
                      <SliderPrimitive.Thumb
                        className="block w-5 h-5 bg-text rounded-full shadow-lg border-2 border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-transform hover:scale-110 active:scale-95"
                        aria-label="Target servo turn angle in degrees"
                      />
                    </SliderPrimitive.Root>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        id="servo-angle-input"
                        type="number"
                        min={10}
                        max={180}
                        value={draftServoAngle}
                        onChange={(e) => handleServoAngleInputChange(e.target.value)}
                        className="w-16 rounded-lg border border-border bg-card px-2 py-1.5 text-sm font-mono text-text text-center focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
                        aria-label="Target servo angle numeric input"
                      />
                      <span className="text-xs text-muted font-mono">deg</span>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted font-medium">Presets:</span>
                    {([45, 90, 180] as const).map((preset) => {
                      const isSelected = draftServoAngle === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDraftServoAngle(preset)}
                          className={cn(
                            "min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                            isSelected
                              ? "bg-accent/15 text-accent border-accent/40 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                              : "bg-white/[0.03] text-muted border-border hover:text-text hover:bg-white/[0.06]",
                          )}
                        >
                          {preset}°
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3) Action Buttons & Saved On Device Footer */}
          <div className="pt-3 border-t border-border/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-muted font-mono">
                <span className="text-text font-medium">Saved on device:</span>{" "}
                <span>
                  {savedServoMin} to {savedServoMax} cm, turns to {savedServoAngle}°, rest 0°
                </span>
              </div>

              {/* Action Buttons: Apply & Reset */}
              <div className="flex items-center gap-2">
                {hasUnsavedServoChanges && (
                  <button
                    type="button"
                    onClick={handleResetServo}
                    disabled={isSavingServo}
                    className="min-h-[44px] px-3.5 py-2 rounded-lg border border-border text-xs font-medium text-muted hover:text-text hover:bg-white/[0.04] transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleApplyServo}
                  disabled={!hasUnsavedServoChanges || isSavingServo}
                  className={cn(
                    "min-h-[44px] px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg",
                    hasUnsavedServoChanges
                      ? "bg-accent text-bg hover:bg-accent/90 shadow-[0_0_20px_rgba(34,211,238,0.3)] active:scale-95"
                      : "bg-white/10 text-muted cursor-not-allowed opacity-60",
                  )}
                >
                  {isSavingServo ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-bg border-t-transparent animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Apply Servo Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
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
            <span className="text-xs text-muted block">
              Saved Trigger Range
            </span>
            <p className="text-xl font-bold font-mono text-text">
              {control.minCm} &mdash; {control.maxCm}{" "}
              <span className="text-xs text-muted">cm</span>
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
                control.buzzerEnabled ? "text-accent" : "text-muted",
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
            <span className="text-xs text-muted block">
              Master System State
            </span>
            <p
              className={cn(
                "text-xl font-bold",
                control.armed ? "text-success" : "text-muted",
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
