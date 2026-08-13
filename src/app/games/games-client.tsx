"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/profile/user-avatar";
import { gameService } from "@/services/game-service";
import { useAuthStore } from "@/stores/auth-store";
import { timeControlLabel } from "@/config/time-controls";
import { cn } from "@/lib/utils";

type Filter = "all" | "wins" | "losses" | "draws";

export function GamesClient() {
  const user = useAuthStore((state) => state.user);
  const selfId = user?.id;
  const [filter, setFilter] = useState<Filter>("all");

  const { data: games, isLoading } = useQuery({
    queryKey: ["games", "history", selfId],
    queryFn: () => gameService.getGames(selfId),
    enabled: Boolean(selfId),
  });

  const filtered = useMemo(() => {
    if (!games) return games;
    return games.filter((game) => {
      const meWhite = game.white.user.id === selfId;
      const won = game.result
        ? game.result.winner === null
          ? null
          : game.result.winner === (meWhite ? "w" : "b")
        : null;
      if (filter === "wins") return won === true;
      if (filter === "losses") return won === false;
      if (filter === "draws") return won === null;
      return true;
    });
  }, [games, filter, selfId]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Games</h1>
        <p className="mt-1 text-muted-foreground">Your recent games and results.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 p-1">
        {(
          [
            { id: "all", label: "All" },
            { id: "wins", label: "Wins" },
            { id: "losses", label: "Losses" },
            { id: "draws", label: "Draws" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              filter === item.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={filter === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent games</CardTitle>
          <CardDescription>Click any game to replay it move by move.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : filtered?.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No games here yet.{" "}
              <Link href="/play/online" className="text-primary hover:underline">
                Start playing
              </Link>
            </p>
          ) : (
            <ul className="divide-y">
              {filtered?.map((game) => {
                const meWhite = game.white.user.id === selfId;
                const opponent = meWhite ? game.black.user : game.white.user;
                const won = game.result
                  ? game.result.winner === null
                    ? null
                    : game.result.winner === (meWhite ? "w" : "b")
                  : null;
                return (
                  <li key={game.id}>
                    <Link href={`/games/${game.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-accent/40">
                      <span
                        className={cn(
                          "inline-flex w-16 justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                          won === true && "bg-emerald-500/15 text-emerald-600",
                          won === false && "bg-destructive/15 text-destructive",
                          won === null && "bg-muted text-muted-foreground",
                        )}
                      >
                        {won === true ? "Win" : won === false ? "Loss" : "Draw"}
                      </span>
                      <UserAvatar user={opponent} className="h-8 w-8 text-xs" />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="block text-sm font-medium">vs {opponent.username}</span>
                        <span className="block text-xs text-muted-foreground">
                          {timeControlLabel(game.timeControl.id)} · {game.rated ? "Rated" : "Casual"}
                        </span>
                      </span>
                      {game.rated && <Trophy className="h-4 w-4 text-amber-500/70" aria-hidden="true" />}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}