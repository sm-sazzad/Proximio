"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import type { Live } from "@/lib/types";

const LiveContext = createContext<Live | null>(null);

export function LiveProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState<Live | null>(null);

  useEffect(() => {
    const liveRef = ref(db, "live");
    const unsubscribe = onValue(liveRef, (snapshot) => {
      const data = snapshot.val() as Live | null;
      setLive(data);
    });
    return () => unsubscribe();
  }, []);

  return <LiveContext value={live}>{children}</LiveContext>;
}

/** Read live data from the nearest LiveProvider */
export function useLive(): Live | null {
  return useContext(LiveContext);
}

