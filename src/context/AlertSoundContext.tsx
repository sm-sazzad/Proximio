"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useLive } from "@/hooks/useLive";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { toast } from "sonner";

interface AlertSoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playTestBeep: () => void;
}

const AlertSoundContext = createContext<AlertSoundContextType>({
  soundEnabled: false,
  toggleSound: () => {},
  playTestBeep: () => {},
});

/**
 * Global audio and alert notification manager:
 * - Manages Web Audio Context adhering to browser autoplay policy
 * - Plays pleasant two-tone chime on new intrusion events (when enabled)
 * - Fires Sonner toast on live.events increases (ignoring reboots/offline/first load)
 * - Prefixes browser tab title with "⚠ ALERT · Proximo" while live.status is "alert"
 */
export function AlertSoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const live = useLive();
  const { online } = useDeviceStatus();

  // Baseline tracker for live.events
  const lastEventsRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);

  // Load sound preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("proximo_alert_sound");
      if (stored === "true") {
        setSoundEnabled(true);
      }
    } catch {
      // localStorage may be unavailable in restricted environments
    }
  }, []);

  // Helper to obtain or resume AudioContext
  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Pleasant two-tone chime (587.33 Hz D5 -> 880 Hz A5)
  const playAlertBeep = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5

      // Envelope
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Audio playback silently caught
    }
  }, [getAudioContext]);

  // Resume AudioContext on first user interaction if reloaded with sound already on
  useEffect(() => {
    if (!soundEnabled) return;

    const handleFirstInteraction = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction, { passive: true });
    window.addEventListener("keydown", handleFirstInteraction, { passive: true });
    window.addEventListener("touchstart", handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [soundEnabled]);

  // Toggle sound with user click
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("proximo_alert_sound", String(next));
      } catch {}

      if (next) {
        // Create/resume AudioContext immediately inside user gesture
        getAudioContext();
        // Subtle confirmation sound
        setTimeout(() => playAlertBeep(), 40);
      }
      return next;
    });
  }, [getAudioContext, playAlertBeep]);

  // Alert Notifications Listener: Toasts + Sound
  useEffect(() => {
    if (!live) return;

    const currentEvents = live.events ?? 0;

    // First load: initialize baseline silently
    if (!hasInitializedRef.current || lastEventsRef.current === null) {
      hasInitializedRef.current = true;
      lastEventsRef.current = currentEvents;
      return;
    }

    const prevEvents = lastEventsRef.current;

    // Device rebooted (counter reset) or offline: update baseline silently without toast
    if (!online || currentEvents < prevEvents) {
      lastEventsRef.current = currentEvents;
      return;
    }

    // New event detected (counter increased)
    if (currentEvents > prevEvents) {
      lastEventsRef.current = currentEvents;

      const closestText =
        live.lastEventMin > 0 ? `closest ${live.lastEventMin} cm` : "proximity breached";

      toast.error(`Alert: object detected, ${closestText}`, {
        id: `alert-event-${currentEvents}`,
        duration: 4000,
      });

      if (soundEnabled) {
        playAlertBeep();
      }
    }
  }, [live, online, soundEnabled, playAlertBeep]);

  // Browser Tab Title Alert Sync
  useEffect(() => {
    if (typeof document === "undefined") return;

    const isAlert = live?.status === "alert";
    if (isAlert) {
      document.title = "⚠ ALERT · Proximo";
    } else {
      document.title = "Proximo";
    }

    return () => {
      document.title = "Proximo";
    };
  }, [live?.status]);

  return (
    <AlertSoundContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        playTestBeep: playAlertBeep,
      }}
    >
      {children}
    </AlertSoundContext.Provider>
  );
}

export function useAlertSound() {
  return useContext(AlertSoundContext);
}
