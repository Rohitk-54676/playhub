"use client";

import { useEffect } from "react";

interface Props {
  trigger: boolean;
  colors?: string[];
  duration?: number;
}

/**
 * Fires a confetti burst when `trigger` flips to true.
 * Uses canvas-confetti (already in package.json).
 */
export function Confetti({
  trigger,
  colors = ["#a855f7", "#ec4899", "#3b82f6", "#f59e0b", "#10b981"],
  duration = 2500,
}: Props) {
  useEffect(() => {
    if (!trigger) return;

    let cancelled = false;

    import("canvas-confetti").then((mod) => {
      if (cancelled) return;
      const confetti = mod.default;

      const end = Date.now() + duration;
      const frame = () => {
        if (Date.now() > end || cancelled) return;
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors,
        });
        requestAnimationFrame(frame);
      };
      frame();

      // Central burst
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [trigger, colors, duration]);

  return null;
}