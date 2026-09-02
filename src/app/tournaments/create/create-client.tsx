"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTournament } from "@/hooks/use-tournament";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

// Timed presets accepted by the backend (no "unlimited" — a bracket game must end).
const TIME_CONTROLS = ["3+2", "5+0", "5+3", "10+0", "10+5"];
const SIZES = [4, 8, 16, 32];

export function CreateTournamentClient() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const create = useCreateTournament();

  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [timeControl, setTimeControl] = useState("5+3");
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold">Log in to create a tournament</h1>
        <Link href="/login?redirect=/tournaments/create" className="text-sm text-primary hover:underline">
          Log in or create an account
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setError("Give it a name of at least 3 characters.");
      return;
    }
    try {
      const tournament = await create.mutateAsync({ name: trimmed, maxPlayers, timeControl });
      router.push(`/tournaments/${tournament.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the tournament.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6">
      <Link
        href="/tournaments"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Tournaments
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">New tournament</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        A single-elimination bracket. You&apos;ll start it manually once enough players have joined.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="tournament-name">Name</Label>
          <Input
            id="tournament-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Friday Night Blitz"
            maxLength={60}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label>Bracket size (registration cap)</Label>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setMaxPlayers(size)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition",
                  maxPlayers === size
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-accent/40",
                )}
              >
                {size} players
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Time control</Label>
          <div className="flex flex-wrap gap-2">
            {TIME_CONTROLS.map((tc) => (
              <button
                key={tc}
                type="button"
                onClick={() => setTimeControl(tc)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition",
                  timeControl === tc
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-accent/40",
                )}
              >
                {tc}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Create tournament
          </Button>
          <Button type="button" variant="ghost" render={<Link href="/tournaments" />}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
