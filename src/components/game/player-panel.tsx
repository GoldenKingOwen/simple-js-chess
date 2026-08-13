"use client";

import { UserAvatar } from "@/components/profile/user-avatar";
import { Clock } from "./clock";
import type { GamePlayerSlot } from "@/stores/game-store";
import { cn } from "@/lib/utils";

interface PlayerPanelProps {
  slot: GamePlayerSlot;
  active: boolean;
  timeMs: number;
  /** Show a "to move" indicator. */
  showTurn?: boolean;
  /** Extra content shown on the right (e.g. captured pieces). */
  right?: React.ReactNode;
  className?: string;
}

/**
 * A player row: avatar, username, rating/title, online dot and clock.
 * Used above and below the board.
 */
export function PlayerPanel({ slot, active, timeMs, showTurn = true, right, className }: PlayerPanelProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors sm:gap-3",
        active ? "border-primary/50 bg-primary/[0.05]" : "border-border/60",
        className,
      )}
      data-active-player={active}
    >
      <UserAvatar user={slot.user ?? { username: slot.username, avatarUrl: slot.avatarUrl }} className="h-8 w-8 sm:h-9 sm:w-9" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {slot.online && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />}
          <span className="truncate text-sm font-semibold sm:text-base">{slot.username}</span>
          {slot.title && <span className="text-xs text-muted-foreground">{slot.title}</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {slot.rating !== null && <span>Rating {slot.rating}</span>}
          {showTurn && (
            <span className={cn("font-medium", active ? "text-primary" : "")} aria-hidden="true">
              {active ? "● to move" : "○"}
            </span>
          )}
        </div>
      </div>
      {right}
      <Clock timeMs={timeMs} active={active} color={slot.color} />
    </div>
  );
}