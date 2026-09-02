"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Loader2, Play, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bracket } from "@/components/tournament/bracket";
import {
  useJoinTournament,
  useLeaveTournament,
  useStartTournament,
  useTournament,
} from "@/hooks/use-tournament";
import { useAuthStore } from "@/stores/auth-store";
import type { Tournament, TournamentPlayer } from "@/types";
import { cn } from "@/lib/utils";

export function TournamentClient({ id }: { id: string }) {
  const user = useAuthStore((s) => s.user);
  const { data: tournament, isLoading, error } = useTournament(id);
  const [actionError, setActionError] = useState<string | null>(null);

  const join = useJoinTournament();
  const leave = useLeaveTournament();
  const start = useStartTournament();
  const busy = join.isPending || leave.isPending || start.isPending;

  const run = (fn: () => Promise<unknown>) => async () => {
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="mx-auto flex min-h-[40vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold">Tournament not found</h1>
        <Button variant="outline" render={<Link href="/tournaments" />}>
          Back to tournaments
        </Button>
      </div>
    );
  }

  const { viewer } = tournament;
  const champion = tournament.players.find((p) => p.userId === tournament.championUserId);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/tournaments"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Tournaments
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tournament.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" aria-hidden="true" />
              {tournament.players.length}/{tournament.maxPlayers}
            </span>
            <span>{tournament.timeControl}</span>
            <StatusPill status={tournament.status} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {viewer.canJoin && (
            <Button onClick={run(() => join.mutateAsync(id))} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Join tournament
            </Button>
          )}
          {viewer.canLeave && (
            <Button variant="outline" onClick={run(() => leave.mutateAsync(id))} disabled={busy}>
              Leave
            </Button>
          )}
          {viewer.canStart && (
            <Button onClick={run(() => start.mutateAsync(id))} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Start bracket
            </Button>
          )}
          {viewer.isCreator && tournament.status === "REGISTRATION" && tournament.players.length < 2 && (
            <p className="text-xs text-muted-foreground">Need 2+ players to start</p>
          )}
        </div>
      </div>

      {actionError && (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive" role="alert">
          {actionError}
        </p>
      )}

      {champion && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Crown className="h-6 w-6 text-amber-500" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">{champion.username} won the tournament</p>
            <p className="text-xs text-muted-foreground">Congratulations to the champion.</p>
          </div>
        </div>
      )}

      {tournament.status === "REGISTRATION" ? (
        <RegistrationList tournament={tournament} currentUserId={user?.id} />
      ) : (
        <>
          <h2 className="mb-3 mt-8 text-lg font-semibold">Bracket</h2>
          <Bracket rounds={tournament.rounds} currentUserId={user?.id} />
          <Standings players={tournament.players} completed={tournament.status === "COMPLETED"} />
        </>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Tournament["status"] }) {
  const map = {
    REGISTRATION: ["Registering", "bg-sky-500/15 text-sky-600"],
    IN_PROGRESS: ["Live", "bg-amber-500/15 text-amber-600"],
    COMPLETED: ["Finished", "bg-muted text-muted-foreground"],
  } as const;
  const [label, className] = map[status];
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", className)}>{label}</span>
  );
}

function RegistrationList({
  tournament,
  currentUserId,
}: {
  tournament: Tournament;
  currentUserId?: string;
}) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-semibold">
        Registered players <span className="text-muted-foreground">({tournament.players.length})</span>
      </h2>
      <ul className="divide-y rounded-xl border">
        {tournament.players.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className={cn(p.userId === currentUserId && "font-medium text-primary")}>
              {p.username}
              {p.userId === tournament.createdByUserId && (
                <span className="ml-2 text-xs text-muted-foreground">host</span>
              )}
            </span>
          </li>
        ))}
        {tournament.players.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">No one registered yet.</li>
        )}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Seeding is by rating when the bracket starts — the top seed gets a bye if the field is odd.
      </p>
    </div>
  );
}

function Standings({ players, completed }: { players: TournamentPlayer[]; completed: boolean }) {
  if (!completed) return null;
  const ranked = [...players].sort((a, b) => (a.finalPlacement ?? 99) - (b.finalPlacement ?? 99));
  return (
    <div className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" /> Final standings
      </h2>
      <ol className="divide-y rounded-xl border">
        {ranked.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="w-8 shrink-0 font-semibold tabular-nums text-muted-foreground">
              {p.finalPlacement ?? "—"}
            </span>
            <span>{p.username}</span>
            {p.seed && <span className="text-xs text-muted-foreground">seed {p.seed}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
