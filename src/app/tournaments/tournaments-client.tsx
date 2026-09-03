"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trophy, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTournaments } from "@/hooks/use-tournament";
import { useAuthStore } from "@/stores/auth-store";
import type { TournamentStatus, TournamentSummary } from "@/types";
import { cn } from "@/lib/utils";

const TABS: { id: TournamentStatus | "ALL"; label: string }[] = [
  { id: "REGISTRATION", label: "Open" },
  { id: "IN_PROGRESS", label: "Live" },
  { id: "COMPLETED", label: "Finished" },
  { id: "ALL", label: "All" },
];

const STATUS_BADGE: Record<TournamentStatus, { label: string; className: string }> = {
  REGISTRATION: { label: "Registering", className: "bg-sky-500/15 text-sky-600" },
  IN_PROGRESS: { label: "Live", className: "bg-amber-500/15 text-amber-600" },
  COMPLETED: { label: "Finished", className: "bg-muted text-muted-foreground" },
};

export function TournamentsClient() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<TournamentStatus | "ALL">("REGISTRATION");
  const { data, isLoading } = useTournaments(tab === "ALL" ? undefined : tab);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tournaments</h1>
          <p className="mt-1 text-muted-foreground">
            Single-elimination brackets. Register, then play each round as it&apos;s drawn.
          </p>
        </div>
        {user && (
          <Button render={<Link href="/tournaments/create" />}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> New tournament
          </Button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition",
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No tournaments here yet.</p>
            {user && (
              <Button variant="outline" size="sm" render={<Link href="/tournaments/create" />}>
                Create one
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {data.map((t) => (
            <li key={t.id}>
              <TournamentRow tournament={t} isChampion={t.championUserId === user?.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TournamentRow({
  tournament: t,
  isChampion,
}: {
  tournament: TournamentSummary;
  isChampion: boolean;
}) {
  const badge = STATUS_BADGE[t.status];
  return (
    <Link
      href={`/tournaments/${t.id}`}
      className="block rounded-xl border bg-card p-4 transition hover:border-primary/50 hover:bg-accent/30"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{t.name}</span>
            {isChampion && (
              <Trophy className="h-4 w-4 shrink-0 text-amber-500" aria-label="You won this" />
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {t.playerCount}/{t.maxPlayers}
            </span>
            <span>{t.timeControl}</span>
            <span className="capitalize">{t.format.replace("_", " ").toLowerCase()}</span>
          </div>
        </div>
        <Badge className={cn("shrink-0 border-0", badge.className)}>{badge.label}</Badge>
      </div>
    </Link>
  );
}
