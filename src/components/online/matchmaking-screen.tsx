"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Swords, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/profile/user-avatar";
import { timeControlLabel } from "@/config/time-controls";
import type { MatchmakingTicket } from "@/types";

interface MatchmakingScreenProps {
  ticket: MatchmakingTicket;
  onCancel: () => void;
  onReady: (gameId: string) => void;
}

/**
 * Renders the live states of quick-play matchmaking:
 * 1. searching — animated spinner, cancel button;
 * 2. found — opponent card + countdown before the game starts.
 * The ticket itself is fetched/pushed by the backend (REST + socket events);
 * the countdown handoff is purely client-side for now.
 */
export function MatchmakingScreen({ ticket, onCancel, onReady }: MatchmakingScreenProps) {
  const searching = ticket.status === "searching" || !ticket.match;
  const match = ticket.match;
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil((match?.countdownMs ?? 5_000) / 1000));

  useEffect(() => {
    if (!match) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      setSecondsLeft(Math.max(0, Math.ceil(match.countdownMs / 1000) - elapsed));
    }, 250);
    return () => window.clearInterval(timer);
  }, [match]);

  useEffect(() => {
    if (!searching && match && secondsLeft <= 0) {
      onReady(match.gameId);
    }
  }, [searching, match, secondsLeft, onReady]);

  const label = useMemo(() => timeControlLabel(ticket.timeControlId as Parameters<typeof timeControlLabel>[0]), [ticket.timeControlId]);

  if (searching || !match) {
    return (
      <Card className="mx-auto mt-10 max-w-md">
        <CardHeader className="items-center text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"
          >
            <Search className="h-7 w-7 text-primary" aria-hidden="true" />
          </motion.div>
          <CardTitle>Searching for an opponent</CardTitle>
          <CardDescription>
            {label} · {ticket.rated ? "Rated" : "Casual"}. We&apos;ll pair you with a player near your rating.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" aria-hidden="true" /> Cancel search
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-10 max-w-md">
      <CardHeader className="items-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10"
        >
          <Swords className="h-7 w-7 text-emerald-600" aria-hidden="true" />
        </motion.div>
        <CardTitle>Opponent found</CardTitle>
        <CardDescription>
          Game starting in {secondsLeft}… You play {match.color === "w" ? "White" : "Black"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pb-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <UserAvatar user={null} className="h-12 w-12 text-sm" />
            <span className="text-sm font-semibold">You</span>
            <span className="text-xs text-muted-foreground">{match.color === "w" ? "White" : "Black"}</span>
          </div>
          <div className="text-lg font-bold text-muted-foreground">VS</div>
          <div className="flex flex-col items-center gap-1">
            <UserAvatar user={match.opponent} className="h-12 w-12 text-sm" />
            <span className="text-sm font-semibold">{match.opponent.username}</span>
            <span className="text-xs text-muted-foreground">
              {match.opponent.rating ?? "—"} · {match.color === "w" ? "Black" : "White"}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Joining when the countdown finishes…</p>
      </CardContent>
    </Card>
  );
}