"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ref, query, limitToLast, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import type { LogEntry, LogEntryWithId } from "@/lib/types";

const LogsContext = createContext<LogEntryWithId[]>([]);

const DEFAULT_LIMIT = 100;

export function LogsProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntryWithId[]>([]);

  useEffect(() => {
    const logsRef = ref(db, "logs");
    const logsQuery = query(logsRef, limitToLast(DEFAULT_LIMIT));

    const unsubscribe = onValue(logsQuery, (snapshot) => {
      const entries: LogEntryWithId[] = [];
      snapshot.forEach((child) => {
        const data = child.val() as LogEntry;
        entries.push({ id: child.key!, ...data });
      });
      // Newest first
      entries.reverse();
      setLogs(entries);
    });

    return () => unsubscribe();
  }, []);

  return <LogsContext value={logs}>{children}</LogsContext>;
}

/** Read log entries from the nearest LogsProvider */
export function useLogs(): LogEntryWithId[] {
  return useContext(LogsContext);
}

