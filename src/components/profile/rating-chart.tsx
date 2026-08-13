import { useId } from "react";
import type { RatingPoint } from "@/types";

interface RatingChartProps {
  points: RatingPoint[];
  height?: number;
  className?: string;
}

/**
 * Lightweight SVG area chart of rating history. No charting dependency —
 * just a path, a gradient fill and min/max labels.
 */
export function RatingChart({ points, height = 180, className }: RatingChartProps) {
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const width = 800;

  if (points.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground" role="img" aria-label="No rating history yet">
        No rating history yet.
      </div>
    );
  }

  const ratings = points.map((point) => point.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const range = max - min || 1;
  const padding = 8;

  const stepX = (width - padding * 2) / Math.max(1, points.length - 1);
  const coord = (index: number) => {
    const x = padding + index * stepX;
    const y = padding + (1 - (ratings[index] - min) / range) * (height - padding * 2);
    return [x, y] as const;
  };

  const linePath = points.map((_, index) => coord(index).join(",")).join(" ");
  const areaPath = `M ${coord(0)[0]},${height - padding} L ${linePath.replace(/ /g, " L ")} L ${coord(points.length - 1)[0]},${height - padding} Z`;
  const last = coord(points.length - 1);

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="Rating history chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${gradientId})`} />
        <polyline points={linePath} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
        <circle cx={last[0]} cy={last[1]} r="4" fill="currentColor" className="text-primary" />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-xs tabular-nums text-muted-foreground">
        <span>{min}</span>
        <span>{points[points.length - 1].rating}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}