"use client";

import { useEffect } from "react";
import { formatTimeMs } from "@/config/time-controls";
import { sounds } from "@/lib/sound/sound-manager";
import { cn } from "@/lib/utils";

interface ClockProps {
  timeMs: number;
  active: boolean;
  /** Side to move — "w" marks white as thinking, drives layout too. */
  color: "w" | "b";
  /** Fire a low-time beep below this threshold. */
  lowTimeMs?: number;
  className?: string;
}

/**
 * Chess clock. Shows remaining time, highlights the active player's clock and
 * beeps once when time gets low.
 */
export function Clock({ timeMs, active, color, lowTimeMs = 30_000, className }: ClockProps) {
  useEffect(() => {
    if (active && timeMs <= lowTimeMs && timeMs > 0) {
      sounds.lowTime();
    }
  }, [active, timeMs, lowTimeMs]);

  const low = timeMs <= lowTimeMs;

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-1.5 font-mono text-sm tabular-nums transition-colors sm:text-base",
        active ? "border-primary/60 bg-primary/10 text-foreground" : "border-transparent bg-muted/40 text-muted-foreground",
        low && active && "animate-pulse border-destructive text-destructive",
        className,
      )}
      role="timer"
      aria-label={`${color === "w" ? "White" : "Black"} clock`}
      aria-live="off"
      data-active={active}
    >
      {formatTimeMs(timeMs)}
    </div>
  );
}