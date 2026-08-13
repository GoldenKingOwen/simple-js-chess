"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flame, Medal, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/profile/user-avatar";
import { leaderboardService } from "@/services/leaderboard-service";
import { useAuthStore } from "@/stores/auth-store";
import type { LeaderboardFilter, LeaderboardPeriod } from "@/types";
import { cn } from "@/lib/utils";

const FILTERS: { id: LeaderboardFilter; label: string }[] = [
  { id: "global", label: "Global" },
  { id: "friends", label: "Friends" },
  { id: "bullet", label: "Bullet" },
  { id: "blitz", label: "Blitz" },
  { id: "rapid", label: "Rapid" },
];

const PERIODS: { id: LeaderboardPeriod; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "month", label: "This month" },
  { id: "week", label: "This week" },
  { id: "day", label: "Today" },
];

const RANK_STYLES: Record<number, string> = {
  1: "bg-amber-500/15 text-amber-600",
  2: "bg-slate-400/15 text-slate-500",
  3: "bg-orange-600/15 text-orange-600",
};

function medalFor(rank: number) {
  if (rank === 1) return <Medal className="h-5 w-5 text-amber-500" aria-label="First place" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" aria-label="Second place" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-orange-600" aria-label="Third place" />;
  return null;
}

export function LeaderboardClient() {
  const selfId = useAuthStore((state) => state.user?.id);
  const [filter, setFilter] = useState<LeaderboardFilter>("global");
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", filter, period],
    queryFn: () => leaderboardService.getLeaderboard(filter, period),
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Leaderboard</h1>
        <p className="mt-1 text-muted-foreground">Who&apos;s on top this period?</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 p-1">
          {FILTERS.map((item) => (
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
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm font-medium transition",
                period === item.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={period === item.id}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : data?.entries.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">No players ranked yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="w-14 px-4 py-3 font-medium">Rank</th>
                    <th className="px-4 py-3 font-medium">Player</th>
                    <th className="px-4 py-3 text-right font-medium">Rating</th>
                    <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Games</th>
                    <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">W/L/D</th>
                    <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Win rate</th>
                    <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.entries.map((entry) => {
                    const isSelf = entry.user.id === selfId;
                    return (
                      <tr
                        key={`${entry.rank}-${entry.user.id}`}
                        className={cn(
                          "border-b last:border-0 hover:bg-accent/30",
                          isSelf && "bg-primary/5",
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2">
                            {medalFor(entry.rank) ?? (
                              <span
                                className={cn(
                                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold",
                                  RANK_STYLES[entry.rank] ?? "bg-muted text-muted-foreground",
                                )}
                              >
                                {entry.rank}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/profile/${entry.user.username}`} className="flex items-center gap-2.5">
                            <UserAvatar user={entry.user} className="h-7 w-7 text-xs" />
                            <span className="font-medium">
                              {entry.user.username}
                              {isSelf && <span className="ml-1 text-xs text-primary">(you)</span>}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{entry.rating}</td>
                        <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">{entry.games}</td>
                        <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                          {entry.wins}/{entry.losses}/{entry.draws}
                        </td>
                        <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground md:table-cell">{entry.winRate}%</td>
                        <td className="hidden px-4 py-3 text-right md:table-cell">
                          <span className={cn("inline-flex items-center gap-1 tabular-nums", entry.streak > 0 ? "text-emerald-600" : "text-muted-foreground")}>
                            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                            {entry.streak}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
        Ratings update after every finished rated game.
      </p>
    </div>
  );
}