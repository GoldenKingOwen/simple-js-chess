"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { GameResult } from "@/types";
import { Crown, Swords, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameResultScreenProps {
  open: boolean;
  result: GameResult;
  whiteName: string;
  blackName: string;
  moveCount: number;
  ratingChanges?: { white: number | null; black: number | null };
  onRematch?: () => void;
  onNewGame?: () => void;
  onViewAnalysis?: () => void;
  onBackToDashboard?: () => void;
}

export function resultTitle(result: GameResult): string {
  if (result.winner === null) {
    switch (result.outcome) {
      case "stalemate":
        return "Draw · Stalemate";
      case "repetition":
        return "Draw · Threefold repetition";
      case "insufficient-material":
        return "Draw · Insufficient material";
      case "agreement":
        return "Draw · Agreement";
      case "fifty-move":
        return "Draw · Fifty-move rule";
    }
  }
  return "Checkmate";
}

export function resultSubtitle(
  result: GameResult,
  whiteName: string,
  blackName: string,
): string {
  if (result.winner === null) return "Neither player wins.";
  const winnerName = result.winner === "w" ? whiteName : blackName;
  switch (result.outcome) {
    case "checkmate":
      return `${winnerName} wins by checkmate.`;
    case "resignation":
      return `${winnerName} wins — opponent resigned.`;
    case "timeout":
      return `${winnerName} wins on time.`;
    case "forfeit":
      return `${winnerName} wins by forfeit.`;
  }
  return `${winnerName} wins.`;
}

/**
 * Full-screen game result overlay shown when a game ends.
 */
export function GameResultScreen({
  open,
  result,
  whiteName,
  blackName,
  moveCount,
  ratingChanges,
  onRematch,
  onNewGame,
  onViewAnalysis,
  onBackToDashboard,
}: GameResultScreenProps) {
  const winner = result.winner;
  const name = winner ? (winner === "w" ? whiteName : blackName) : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Game over"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-2xl"
          >
            <div
              className={cn(
                "flex flex-col items-center gap-1 px-6 py-8 text-center",
                winner ? "bg-gradient-to-b from-primary/15 to-transparent" : "bg-muted/30",
              )}
            >
              {winner ? (
                <Trophy className="h-10 w-10 text-primary" aria-hidden="true" />
              ) : (
                <Swords className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
              )}
              <h2 className="mt-2 text-2xl font-bold tracking-tight">{resultTitle(result)}</h2>
              <CardDescription className="text-sm">{resultSubtitle(result, whiteName, blackName)}</CardDescription>
              {winner && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-sm font-semibold">
                  <Crown className="h-4 w-4 text-primary" aria-hidden="true" />
                  {name}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Badge variant="outline">{moveCount} moves</Badge>
                {ratingChanges && (
                  <>
                    <Badge
                      variant="outline"
                      data-positive={ratingChanges.white !== null && ratingChanges.white >= 0}
                    >
                      {whiteName} {ratingChanges.white !== null ? `${ratingChanges.white >= 0 ? "+" : ""}${ratingChanges.white}` : "±0"}
                    </Badge>
                    <Badge variant="outline">
                      {blackName} {ratingChanges.black !== null ? `${ratingChanges.black >= 0 ? "+" : ""}${ratingChanges.black}` : "±0"}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <Separator />
            <div className="grid gap-2 p-4">
              {onRematch && (
                <Button onClick={onRematch} size="lg">
                  Rematch
                </Button>
              )}
              {onNewGame && (
                <Button variant="secondary" onClick={onNewGame} size="lg">
                  New game
                </Button>
              )}
              {onViewAnalysis && (
                <Button variant="outline" onClick={onViewAnalysis}>
                  View analysis
                </Button>
              )}
              {onBackToDashboard && (
                <Button variant="ghost" onClick={onBackToDashboard}>
                  Back to dashboard
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}