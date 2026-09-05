"use client";

import { useMemo } from "react";
import type { AnalyzedPly } from "@/types";
import { cn } from "@/lib/utils";

const CLAMP = 800; // centipawns shown at full height
const W = 100;
const H = 32;

const CLASS_DOT: Record<string, string> = {
  INACCURACY: "fill-amber-500",
  MISTAKE: "fill-orange-500",
  BLUNDER: "fill-destructive",
};

interface EvalGraphProps {
  plies: AnalyzedPly[];
  /** Current replay position: -1 = start, i = after ply i. */
  position: number;
  onSeek?: (position: number) => void;
}

/**
 * White-advantage eval curve across the game. Positive (white better) is the
 * top half. Inaccuracies/mistakes/blunders are marked; click to jump to a ply.
 */
export function EvalGraph({ plies, position, onSeek }: EvalGraphProps) {
  const points = useMemo(() => {
    // eval after each ply, from White's POV. playedEvalCp is the mover's POV.
    const perWhite = plies.map((p) =>
      p.color === "WHITE" ? p.playedEvalCp : -p.playedEvalCp,
    );
    const series = [0, ...perWhite];
    return series.map((cp, i) => {
      const clamped = Math.max(-CLAMP, Math.min(CLAMP, cp));
      const x = series.length > 1 ? (i / (series.length - 1)) * W : 0;
      const y = H / 2 - (clamped / CLAMP) * (H / 2);
      return { x, y };
    });
  }, [plies]);

  if (plies.length === 0) return null;

  const areaPath =
    `M0,${H / 2} ` +
    points.map((pt) => `L${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(" ") +
    ` L${W},${H / 2} Z`;
  const linePath = "M" + points.map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(" L");

  const cursorX = ((position + 1) / (points.length - 1 || 1)) * W;

  return (
    <div className="rounded-lg border bg-card p-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-16 w-full"
        role="img"
        aria-label="Evaluation graph"
      >
        <rect x="0" y="0" width={W} height={H / 2} className="fill-foreground/[0.04]" />
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} className="stroke-border" strokeWidth="0.3" />
        <path d={areaPath} className="fill-primary/15" />
        <path d={linePath} className="fill-none stroke-primary" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        {plies.map((p, i) =>
          CLASS_DOT[p.classification] ? (
            <circle
              key={p.ply}
              cx={points[i + 1]?.x ?? 0}
              cy={points[i + 1]?.y ?? H / 2}
              r="1"
              className={CLASS_DOT[p.classification]}
            />
          ) : null,
        )}
        <line
          x1={cursorX}
          y1="0"
          x2={cursorX}
          y2={H}
          className="stroke-foreground/60"
          strokeWidth="0.4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {onSeek && (
        <input
          type="range"
          min={-1}
          max={plies.length - 1}
          value={position}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Seek in evaluation graph"
          className={cn("mt-1 h-1 w-full cursor-pointer appearance-none rounded bg-muted", "accent-primary")}
        />
      )}
    </div>
  );
}
