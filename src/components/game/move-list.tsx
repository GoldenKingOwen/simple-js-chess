"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { EngineMove } from "@/lib/chess/chess-engine";
import type { MoveClassification } from "@/types";
import { cn } from "@/lib/utils";

const NAG: Record<MoveClassification, { symbol: string; className: string } | null> = {
  GOOD: null,
  INACCURACY: { symbol: "?!", className: "text-amber-600" },
  MISTAKE: { symbol: "?", className: "text-orange-600" },
  BLUNDER: { symbol: "??", className: "text-destructive" },
};

interface MoveListProps {
  moves: EngineMove[];
  /** Index of the move currently "selected" (for replay). Null = live. */
  activeIndex?: number | null;
  onSelectMove?: (index: number) => void;
  /** Post-game analysis classification per ply index (from the analysis feature). */
  classifications?: Record<number, MoveClassification>;
  className?: string;
}

/**
 * Standard algebraic move list in numbered white/black pairs. Highlights the
 * selected move and marks checks/checkmates. Supports replay navigation via
 * `onSelectMove`.
 */
export function MoveList({
  moves,
  activeIndex = null,
  onSelectMove,
  classifications,
  className,
}: MoveListProps) {
  const pairs: { number: number; white?: EngineMove; black?: EngineMove; whiteIndex: number; blackIndex: number }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: i / 2 + 1,
      white: moves[i],
      black: moves[i + 1],
      whiteIndex: i,
      blackIndex: i + 1,
    });
  }

  return (
    <ScrollArea className={cn("h-full w-full", className)}>
      {pairs.length === 0 ? (
        <p className="p-4 text-center text-sm text-muted-foreground">No moves yet.</p>
      ) : (
        <table className="w-full text-sm" aria-label="Move list">
          <tbody>
            {pairs.map((pair) => (
              <tr key={pair.number} className="border-b border-border/40 last:border-0">
                <td className="w-10 py-1 pr-1 text-right text-xs text-muted-foreground">{pair.number}.</td>
                <td className="w-1/2 py-1">
                  <MoveCell
                    move={pair.white}
                    index={pair.whiteIndex}
                    activeIndex={activeIndex}
                    onSelect={onSelectMove}
                    classification={classifications?.[pair.whiteIndex]}
                  />
                </td>
                <td className="w-1/2 py-1">
                  <MoveCell
                    move={pair.black}
                    index={pair.blackIndex}
                    activeIndex={activeIndex}
                    onSelect={onSelectMove}
                    classification={classifications?.[pair.blackIndex]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ScrollArea>
  );
}

function MoveCell({
  move,
  index,
  activeIndex,
  onSelect,
  classification,
}: {
  move?: EngineMove;
  index: number;
  activeIndex: number | null;
  onSelect?: (index: number) => void;
  classification?: MoveClassification;
}) {
  if (!move) return <span className="block h-6" aria-hidden="true" />;
  const active = activeIndex === index;
  const nag = classification ? NAG[classification] : null;
  return (
    <span
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-current={active ? "true" : undefined}
      onClick={onSelect ? () => onSelect(index) : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(index);
              }
            }
          : undefined
      }
      className={cn(
        "inline-flex cursor-default items-center gap-0.5 rounded px-1.5 py-0.5 font-medium",
        active && "bg-primary/15 text-primary ring-1 ring-primary/30",
      )}
      data-move-index={index}
    >
      {move.san}
      {move.isCheckmate && <span className="text-destructive">#</span>}
      {move.isCheck && !move.isCheckmate && <span>+</span>}
      {nag && <span className={cn("font-bold", nag.className)}>{nag.symbol}</span>}
    </span>
  );
}