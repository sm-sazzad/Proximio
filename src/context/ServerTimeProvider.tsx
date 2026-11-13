"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

const ServerTimeOffsetContext = createContext<number>(0);

export function ServerTimeProvider({ children }: { children: ReactNode }) {
  const [offset, setOffset] = useState<number>(0);

  useEffect(() => {
    const offsetRef = ref(db, ".info/serverTimeOffset");
    const unsubscribe = onValue(offsetRef, (snapshot) => {
      const value = snapshot.val() as number | null;
      setOffset(value ?? 0);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ServerTimeOffsetContext value={offset}>
      {children}
    </ServerTimeOffsetContext>
  );
}

/** Read the Firebase server time offset (ms) from the nearest ServerTimeProvider */
export function useServerTimeOffset(): number {
  return useContext(ServerTimeOffsetContext);
}

