"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, Bot, ChartNoAxesCombined, GraduationCap, Swords, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/profile/user-avatar";
import { useAuthStore } from "@/stores/auth-store";
import { profileService } from "@/services/profile-service";
import { gameService } from "@/services/game-service";
import { friendService } from "@/services/friend-service";
import { notificationService } from "@/services/notification-service";
import { BadgeGrid } from "@/components/achievements/badge-grid";
import { useMyAchievements } from "@/hooks/use-achievements";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const selfId = user?.id;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileService.getProfile(user?.username ?? "me"),
    enabled: Boolean(user),
  });

  const { data: achievements } = useMyAchievements(Boolean(user));

  const { data: recentGames, isLoading: gamesLoading } = useQuery({
    queryKey: ["games", "recent"],
    queryFn: () => gameService.getGames(user?.username),
    enabled: Boolean(selfId),
  });

  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ["friends", "list"],
    queryFn: () => friendService.getFriends(),
    enabled: Boolean(selfId),
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: Boolean(selfId),
  });

  const onlineFriends = useMemo(() => friends?.filter((friend) => friend.user.status !== "offline") ?? [], [friends]);

  const stats = [
    { label: "Rating", value: profile?.rating ?? user?.rating, icon: Trophy },
    { label: "Games played", value: profile?.stats.gamesPlayed, icon: ChartNoAxesCombined },
    { label: "Wins", value: profile?.stats.wins, icon: Trophy },
    { label: "Losses", value: profile?.stats.losses, icon: Trophy },
    { label: "Win rate", value: profile ? `${profile.stats.winRate}%` : undefined, icon: ChartNoAxesCombined },
  ];

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}, {profile?.username ?? user?.username ?? "player"}.
          </h1>
          <p className="mt-1 text-muted-foreground">Your chess home — pick up where you left off.</p>
        </div>
        <Button variant="outline" size="sm" render={<Link href="/notifications" />} className="gap-1.5">
          <Bell className="h-4 w-4" aria-hidden="true" /> Notifications
          {unreadCount ? (
            <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-white">
              {unreadCount}
            </span>
          ) : null}
        </Button>
      </div>

      {/* Quick play actions */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          { href: "/play/online", icon: Swords, title: "Quick play", subtitle: "Find an opponent" },
          { href: "/play/bot", icon: Bot, title: "Play the bot", subtitle: "Practice anytime" },
          { href: "/learn", icon: GraduationCap, title: "Learn", subtitle: "Guided path to expert" },
          { href: "/tournaments", icon: Trophy, title: "Tournaments", subtitle: "Compete in a bracket" },
          { href: "/play/local", icon: Users, title: "Local game", subtitle: "Play on this device" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:border-primary/40 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary/15">
              <action.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">{action.title}</span>
              <span className="block truncate text-sm text-muted-foreground">{action.subtitle}</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your statistics</CardTitle>
              <CardDescription>All-time numbers across every game you&apos;ve played.</CardDescription>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-muted/40 p-3 text-center">
                      <stat.icon className="mx-auto mb-1 h-4 w-4 text-primary" aria-hidden="true" />
                      <div className="text-xl font-bold tabular-nums">{stat.value ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Badges */}
          {achievements && achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-base">
                  <Trophy className="h-4 w-4 text-primary" aria-hidden="true" /> Badges
                </CardTitle>
                <CardDescription>Milestones you&apos;ve unlocked across the app.</CardDescription>
              </CardHeader>
              <CardContent>
                <BadgeGrid achievements={achievements} />
              </CardContent>
            </Card>
          )}

          {/* Recent games */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent games</CardTitle>
              <CardDescription>Your latest finished games.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {gamesLoading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : recentGames?.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No games yet. <Link href="/play/online" className="text-primary hover:underline">Play your first game</Link>.
                </p>
              ) : (
                <ul className="divide-y">
                  {recentGames?.map((game) => {
                    const meWhite = game.white.user.id === selfId;
                    const opponent = meWhite ? game.black.user : game.white.user;
                    const won = game.result
                      ? game.result.winner === null
                        ? null
                        : game.result.winner === (meWhite ? "w" : "b")
                      : null;
                    return (
                      <li key={game.id}>
                        <Link
                          href={`/games/${game.id}`}
                          className="flex items-center gap-3 px-4 py-3 transition hover:bg-accent/40"
                        >
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
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">vs {opponent.username}</span>
                          <span className="hidden text-xs text-muted-foreground sm:inline">
                            {game.timeControl.label}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" aria-hidden="true" /> Friends online
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  <Link href="/friends" className="hover:underline">View all</Link>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {friendsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : onlineFriends.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">None of your friends are online right now.</p>
              ) : (
                <ul className="space-y-1.5">
                  {onlineFriends.map((friend) => (
                    <li key={friend.user.id}>
                      <Link href={`/profile/${friend.user.username}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent/40">
                        <UserAvatar user={friend.user} className="h-7 w-7 text-xs" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{friend.user.username}</span>
                        <span className="relative flex h-2.5 w-2.5">
                          {friend.user.status === "online" && (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          )}
                          <span
                            className={cn(
                              "relative inline-flex h-2.5 w-2.5 rounded-full",
                              friend.user.status === "online" && "bg-emerald-500",
                              friend.user.status === "in-game" && "bg-amber-500",
                              friend.user.status === "offline" && "bg-muted-foreground/40",
                            )}
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Control the center, develop your pieces, and castle early. The middlegame is won by the player with the
                more active pieces.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}