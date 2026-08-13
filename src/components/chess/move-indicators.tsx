import type { BoardOverlays } from "@/config/board-themes";

export interface IndicatorCell {
  square: string;
  isTarget: boolean;
  isCaptureTarget: boolean;
  isSelected: boolean;
  isLastMove: boolean;
  isCheck: boolean;
}

interface MoveIndicatorsProps {
  cells: IndicatorCell[];
  overlays: BoardOverlays;
}

/**
 * Renders move/selection state as a full-board overlay aligned with the square
 * grid (same 8×8 layout). Entirely pointer-transparent so all interaction goes
 * to the squares below.
 */
export function MoveIndicators({ cells, overlays }: MoveIndicatorsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid grid-cols-8 grid-rows-8">
      {cells.map((cell) => {
        if (cell.isCheck) {
          return (
            <span
              key={cell.square}
              data-square={cell.square}
              data-testid={`check-${cell.square}`}
              aria-hidden="true"
              className="relative"
            >
              <span
                className="absolute inset-0"
                style={{ background: overlays.check, boxShadow: "inset 0 0 14px rgba(0,0,0,0.45)" }}
              />
            </span>
          );
        }
        if (cell.isSelected) {
          return (
            <span
              key={cell.square}
              data-square={cell.square}
              data-testid={`selected-${cell.square}`}
              aria-hidden="true"
              className="relative"
            >
              <span className="absolute inset-0" style={{ boxShadow: `inset 0 0 0 4px ${overlays.selected}` }} />
            </span>
          );
        }
        if (cell.isLastMove) {
          return (
            <span
              key={cell.square}
              data-square={cell.square}
              data-testid={`last-move-${cell.square}`}
              aria-hidden="true"
              className="relative"
            >
              <span className="absolute inset-0" style={{ background: overlays.lastMove }} />
            </span>
          );
        }
        if (cell.isTarget) {
          return (
            <span
              key={cell.square}
              data-square={cell.square}
              data-testid={`move-target-${cell.square}`}
              aria-hidden="true"
              className="relative"
            >
              {cell.isCaptureTarget ? (
                <span
                  className="absolute inset-0"
                  style={{ boxShadow: `inset 0 0 0 5px ${overlays.legalMoveCapture}` }}
                />
              ) : (
                <span
                  className="absolute left-1/2 top-1/2 h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ background: overlays.legalMoveDot }}
                />
              )}
            </span>
          );
        }
        return <span key={cell.square} aria-hidden="true" className="relative" />;
      })}
    </div>
  );
}