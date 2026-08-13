"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Flag, Gamepad2, Globe2, Swords, Timer, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/profile/user-avatar";
import { RatingChart } from "@/components/profile/rating-chart";
import { profileService } from "@/services/profile-service";
import { gameService } from "@/services/game-service";
import { useAuthStore } from "@/stores/auth-store";
import { timeControlLabel } from "@/config/time-controls";
import { cn } from "@/lib/utils";

export function ProfileClient({ username }: { username: string }) {
  const selfId = useAuthStore((state) => state.user?.id);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => profileService.getProfile(username),
  });

  const { data: games } = useQuery({
    queryKey: ["games", "history"],
    queryFn: () => gameService.getGames(selfId),
    enabled: Boolean(selfId),
  });

  const recentGames = useMemo(() => {
    if (!profile || !games) return [];
    return profile.recentGames
      .map((id) => games.find((game) => game.id === id))
      .filter((game): game is NonNullable<typeof game> => Boolean(game));
  }, [profile, games]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-10 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-xl font-semibold">Player not found</h1>
        <p className="text-sm text-muted-foreground">This profile does not exist or was removed.</p>
        <Button variant="outline" render={<Link href="/leaderboard" />}>
          Back to leaderboard
        </Button>
      </div>
    );
  }

  const isSelf = profile.id === selfId;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Button variant="ghost" size="sm" className="mb-4 gap-1" render={<Link href="/leaderboard" />}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Leaderboard
      </Button>

      {/* Header card */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <UserAvatar user={profile} className="h-20 w-20 text-2xl" />
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              {profile.username}
              {isSelf && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">You</span>}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.title && <span className="font-medium text-foreground">{profile.title}</span>}
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Rating: {profile.rating}
              </span>
              <span className="inline-flex items-center gap-1">
                <Globe2 className="h-3.5 w-3.5" aria-hidden="true" /> {profile.country ?? "Earth"}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Member since {new Date(profile.createdAt).getFullYear()}
              </span>
            </div>
            {profile.bio && <p className="mt-2 text-sm text-muted-foreground">{profile.bio}</p>}
          </div>
          <div className="flex gap-2">
            {isSelf ? (
              <Button variant="outline" render={<Link href="/settings/account" />}>
                Edit profile
              </Button>
            ) : (
              <Button render={<Link href="/play/online" />}>
                <Swords className="mr-2 h-4 w-4" aria-hidden="true" /> Challenge
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rating chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Rating over time</CardTitle>
          <CardDescription>Last {profile.ratingHistory.length} rated games.</CardDescription>
        </CardHeader>
        <CardContent>
          <RatingChart points={profile.ratingHistory} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statistics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Games played", value: profile.stats.gamesPlayed, icon: Gamepad2 },
              { label: "Wins", value: profile.stats.wins, icon: Trophy },
              { label: "Losses", value: profile.stats.losses, icon: Flag },
              { label: "Draws", value: profile.stats.draws, icon: Timer },
              { label: "Win rate", value: `${profile.stats.winRate}%`, icon: Trophy },
              { label: "Streak", value: profile.stats.currentStreak, icon: Timer },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-muted/40 p-3 text-center">
                <stat.icon className="mx-auto mb-1 h-4 w-4 text-primary" aria-hidden="true" />
                <div className="text-lg font-bold tabular-nums">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent games */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent games</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentGames.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No recent games.</p>
            ) : (
              <ul className="divide-y">
                {recentGames.map((game) => {
                  const meWhite = game.white.user.id === profile.id;
                  const opponent = meWhite ? game.black.user : game.white.user;
                  const won = game.result
                    ? game.result.winner === null
                      ? null
                      : game.result.winner === (meWhite ? "w" : "b")
                    : null;
                  return (
                    <li key={game.id}>
                      <Link href={`/games/${game.id}`} className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-accent/40">
                        <span
                          className={cn(
                            "inline-flex w-14 justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                            won === true && "bg-emerald-500/15 text-emerald-600",
                            won === false && "bg-destructive/15 text-destructive",
                            won === null && "bg-muted text-muted-foreground",
                          )}
                        >
                          {won === true ? "Win" : won === false ? "Loss" : "Draw"}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">vs {opponent.username}</span>
                        <span className="text-xs text-muted-foreground">{timeControlLabel(game.timeControl.id)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}