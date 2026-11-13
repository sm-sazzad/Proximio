"use client";

import type { ReactNode } from "react";
import { LiveProvider } from "./LiveProvider";
import { ControlProvider } from "./ControlProvider";
import { LogsProvider } from "./LogsProvider";
import { ServerTimeProvider } from "./ServerTimeProvider";
import { DistanceBufferProvider } from "./DistanceBufferProvider";
import { AlertSoundProvider } from "./AlertSoundContext";

/**
 * Wraps all Firebase and persistent state providers into a single component.
 * Mount this once in the root layout.
 */
export function FirebaseProviders({ children }: { children: ReactNode }) {
  return (
    <ServerTimeProvider>
      <LiveProvider>
        <ControlProvider>
          <LogsProvider>
            <DistanceBufferProvider>
              <AlertSoundProvider>
                {children}
              </AlertSoundProvider>
            </DistanceBufferProvider>
          </LogsProvider>
        </ControlProvider>
      </LiveProvider>
    </ServerTimeProvider>
  );
}
