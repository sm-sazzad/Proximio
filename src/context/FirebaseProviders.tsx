"use client";

import type { ReactNode } from "react";
import { LiveProvider } from "./LiveProvider";
import { ControlProvider } from "./ControlProvider";
import { LogsProvider } from "./LogsProvider";
import { ServerTimeProvider } from "./ServerTimeProvider";

/**
 * Wraps all Firebase context providers into a single component.
 * Mount this once in the root layout.
 */
export function FirebaseProviders({ children }: { children: ReactNode }) {
  return (
    <ServerTimeProvider>
      <LiveProvider>
        <ControlProvider>
          <LogsProvider>{children}</LogsProvider>
        </ControlProvider>
      </LiveProvider>
    </ServerTimeProvider>
  );
}

