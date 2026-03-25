"use client";

import { useEffect, useMemo, useState } from "react";

export function AnimatedCounter({ value, durationMs = 900 }: { value: number; durationMs?: number }) {
  const [display, setDisplay] = useState(0);
  const safe = useMemo(() => Math.max(0, Number.isFinite(value) ? value : 0), [value]);

  useEffect(() => {
    const start = performance.now();
    const initial = display;
    const delta = safe - initial;
    let raf = 0;

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(initial + delta * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safe]);

  return <span>{display.toLocaleString()}</span>;
}
