"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";
import type { Control } from "@/lib/types";

interface ControlContextValue {
  control: Control | null;
  updateControl: (partial: Partial<Control>) => Promise<void>;
}

const ControlContext = createContext<ControlContextValue>({
  control: null,
  updateControl: async () => {},
});

export function ControlProvider({ children }: { children: ReactNode }) {
  const [control, setControl] = useState<Control | null>(null);

  useEffect(() => {
    const controlRef = ref(db, "control");
    const unsubscribe = onValue(controlRef, (snapshot) => {
      const data = snapshot.val() as Control | null;
      setControl(data);
    });
    return () => unsubscribe();
  }, []);

  const updateControl = useCallback(async (partial: Partial<Control>) => {
    const controlRef = ref(db, "control");
    await update(controlRef, partial);
  }, []);

  return (
    <ControlContext value={{ control, updateControl }}>
      {children}
    </ControlContext>
  );
}

/** Read control data and the update function from the nearest ControlProvider */
export function useControl() {
  return useContext(ControlContext);
}

