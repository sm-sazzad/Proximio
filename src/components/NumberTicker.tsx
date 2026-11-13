"use client";

import { useEffect, useState } from "react";
import { useMotionValue, useSpring } from "framer-motion";

interface NumberTickerProps {
  value: number;
  decimalPlaces?: number;
  className?: string;
}

/**
 * Animated number ticker using Framer Motion springs.
 * Smoothly transitions between numerical values without jitter.
 */
export function NumberTicker({
  value,
  decimalPlaces = 1,
  className = "",
}: NumberTickerProps) {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, {
    stiffness: 80,
    damping: 18,
  });
  const [displayValue, setDisplayValue] = useState<string>(
    value.toFixed(decimalPlaces)
  );

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(latest.toFixed(decimalPlaces));
    });
    return () => unsubscribe();
  }, [springValue, decimalPlaces]);

  return <span className={className}>{displayValue}</span>;
}

