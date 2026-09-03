"use client";

import Link from "next/link";
import { Check, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TournamentPairing, TournamentRound } from "@/types";

function roundName(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinals";
  if (fromEnd === 2) return "Quarterfinals";
  return `Round ${roundNumber}`;
}

interface BracketProps {
  rounds: TournamentRound[];
  currentUserId?: string;
}

/**
 * Single-elimination bracket tree. Rounds are columns; each pairing is a card
 * with both seats, the winner marked. Purpose-built — the app has no other
 * bracket visual to reuse.
 */
export function Bracket({ rounds, currentUserId }: BracketProps) {
  if (rounds.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        The bracket appears here once the tournament starts.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-fit gap-4">
        {rounds.map((round) => (
          <div key={round.roundNumber} className="flex w-60 shrink-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{roundName(round.roundNumber, rounds.length)}</h3>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  round.status === "COMPLETED"
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-amber-500/15 text-amber-600",
                )}
              >
                {round.status === "COMPLETED" ? "Done" : "Live"}
              </span>
            </div>
            {round.pairings.map((pairing) => (
              <PairingCard key={pairing.id} pairing={pairing} currentUserId={currentUserId} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PairingCard({
  pairing,
  currentUserId,
}: {
  pairing: TournamentPairing;
  currentUserId?: string;
}) {
  const involvesMe =
    !!currentUserId &&
    (pairing.player1?.userId === currentUserId || pairing.player2?.userId === currentUserId);
  const playable =
    pairing.gameId &&
    involvesMe &&
    pairing.gameStatus !== "COMPLETED" &&
    !pairing.winnerId;

  const inner = (
    <div
      className={cn(
        "rounded-lg border bg-card transition",
        involvesMe && "border-primary/50 ring-1 ring-primary/20",
        playable && "hover:border-primary hover:bg-accent/40",
      )}
    >
      <Seat
        name={pairing.player1?.username ?? (pairing.isBye ? "—" : "TBD")}
        isWinner={pairing.winnerId === pairing.player1?.id}
        decided={!!pairing.winnerId}
        isMe={pairing.player1?.userId === currentUserId}
      />
      <div className="border-t" />
      <Seat
        name={pairing.isBye ? "Bye" : (pairing.player2?.username ?? "TBD")}
        isWinner={pairing.winnerId === pairing.player2?.id}
        decided={!!pairing.winnerId}
        isMe={pairing.player2?.userId === currentUserId}
        muted={pairing.isBye}
      />
      {playable ? (
        <div className="flex items-center gap-1.5 border-t px-3 py-1.5 text-xs font-medium text-primary">
          <Swords className="h-3.5 w-3.5" aria-hidden="true" /> Play your game
        </div>
      ) : pairing.gameId && !pairing.winnerId ? (
        <div className="border-t px-3 py-1.5 text-xs text-muted-foreground">In progress</div>
      ) : null}
    </div>
  );

  if (playable && pairing.gameId) {
    return (
      <Link href={`/game/${pairing.gameId}`} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

function Seat({
  name,
  isWinner,
  decided,
  isMe,
  muted,
}: {
  name: string;
  isWinner: boolean;
  decided: boolean;
  isMe?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 text-sm",
        decided && !isWinner && "text-muted-foreground line-through decoration-1",
        muted && "text-muted-foreground",
      )}
    >
      <span className={cn("truncate", isWinner && "font-semibold", isMe && "text-primary")}>
        {name}
      </span>
      {isWinner && <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Winner" />}
    </div>
  );
}
