"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Gamepad2, Link2, Plus, Swords, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MatchmakingScreen } from "@/components/online/matchmaking-screen";
import { onSocket } from "@/lib/socket/socket-client";
import { SOCKET_EVENTS } from "@/lib/socket/socket-events";
import { gameService } from "@/services/game-service";
import { TIME_CONTROL_LIST, timeControlLabel } from "@/config/time-controls";
import type { MatchmakingTicket, TimeControlId } from "@/types";
import { cn } from "@/lib/utils";

const QUICK_IDS: TimeControlId[] = ["bullet", "blitz", "rapid", "classical"];

export default function OnlinePlayPage() {
  return (
    <Suspense fallback={null}>
      <OnlineLobby />
    </Suspense>
  );
}

function OnlineLobby() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [timeControlId, setTimeControlId] = useState<TimeControlId>("rapid");
  const [rated, setRated] = useState(true);
  const [ticket, setTicket] = useState<MatchmakingTicket | null>(null);
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const activeSection = searchParams.get("mode") === "create" ? "create" : searchParams.get("mode") === "join" ? "join" : "quick";

  const startMatchmaking = useCallback(async () => {
    setTicket(await gameService.startMatchmaking({ timeControlId, rated }));
  }, [timeControlId, rated]);

  // While searching, the backend emits `matchmakingMatched` when an opponent
  // is found — turn that into a found ticket so the countdown can start.
  useEffect(() => {
    if (!ticket || ticket.status !== "searching") return;
    return onSocket(SOCKET_EVENTS.matchmakingMatched, (payload) => {
      gameService
        .getGame(payload.gameId)
        .then((game) => {
          const color = game.myColor ?? "w";
          setTicket((current) =>
            current
              ? {
                  ...current,
                  status: "found",
                  matchedGameId: payload.gameId,
                  match: {
                    opponent: color === "w" ? game.black.user : game.white.user,
                    gameId: payload.gameId,
                    color,
                    countdownMs: 5_000,
                  },
                }
              : current,
          );
        })
        .catch(() => {
          // Game not fetchable yet — the REST response will cover it.
        });
    });
  }, [ticket]);

  const createGame = useCallback(async () => {
    setCreating(true);
    try {
      const game = await gameService.createGame({ mode: "online", timeControlId, rated, colorPreference: "random" });
      setCreatedId(game.id);
    } finally {
      setCreating(false);
    }
  }, [timeControlId, rated]);

  const joinGame = useCallback(() => {
    const value = joinInput.trim();
    if (!value) {
      setJoinError("Enter a game ID or link.");
      return;
    }
    const match = value.match(/\/game\/([a-zA-Z0-9_-]+)/);
    const gameId = match ? match[1] : value.replace(/^\/+/, "");
    if (!/^[a-zA-Z0-9_-]+$/.test(gameId)) {
      setJoinError("That does not look like a valid game link.");
      return;
    }
    setJoinError(null);
    router.push(`/game/${gameId}`);
  }, [joinInput, router]);

  const inviteUrl = useMemo(() => (createdId ? `${window.location.origin}/game/${createdId}` : null), [createdId]);

  if (ticket) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Button variant="ghost" size="sm" className="mb-6 gap-1" onClick={() => setTicket(null)}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Button>
        <MatchmakingScreen
          key={ticket.match?.gameId ?? "searching"}
          ticket={ticket}
          onCancel={async () => {
            if (ticket.id) await gameService.cancelMatchmaking(ticket.id).catch(() => undefined);
            setTicket(null);
          }}
          onReady={(gameId) => router.push(`/game/${gameId}`)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Play online</h1>
          <p className="mt-1 text-muted-foreground">Find an opponent, create a private game or join a friend.</p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.push("/play")}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Play menu
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl border bg-muted/40 p-1">
        {(
          [
            { id: "quick", label: "Quick play", icon: Swords },
            { id: "create", label: "Create game", icon: Gamepad2 },
            { id: "join", label: "Join game", icon: UserPlus },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => router.replace(`/play/online${tab.id === "quick" ? "" : `?mode=${tab.id}`}`)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
              activeSection === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={activeSection === tab.id}
          >
            <tab.icon className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeSection === "quick" && (
        <Card>
          <CardHeader>
            <CardTitle>Quick play</CardTitle>
            <CardDescription>Instant matchmaking — no setup required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="tc-quick">Time control</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {QUICK_IDS.map((id) => {
                  const tc = TIME_CONTROL_LIST.find((item) => item.id === id)!;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTimeControlId(id)}
                      className={cn(
                        "flex flex-col items-center rounded-lg border p-3 transition",
                        timeControlId === id
                          ? "border-primary bg-primary/5 text-foreground"
                          : "text-muted-foreground hover:bg-accent/40",
                      )}
                      aria-pressed={timeControlId === id}
                    >
                      <span className="font-semibold">{tc.label}</span>
                      <span className="text-xs">{tc.timeMs / 60000}+{tc.incrementMs / 1000}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Rated game</p>
                <p className="text-xs text-muted-foreground">Changes your rating when it ends.</p>
              </div>
              <Switch checked={rated} onCheckedChange={setRated} aria-label="Rated game" />
            </div>

            <Button size="lg" className="w-full" onClick={startMatchmaking}>
              <Swords className="mr-2 h-4 w-4" aria-hidden="true" /> Search for a game
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {timeControlLabel(timeControlId)} · {rated ? "Rated" : "Casual"}
            </p>
          </CardContent>
        </Card>
      )}

      {activeSection === "create" && (
        <Card>
          <CardHeader>
            <CardTitle>Create a private game</CardTitle>
            <CardDescription>Set it up, share the link, and play when your friend joins.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="tc-create">Time control</Label>
              <select
                id="tc-create"
                value={timeControlId}
                onChange={(event) => setTimeControlId(event.target.value as TimeControlId)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TIME_CONTROL_LIST.map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    {timeControlLabel(tc.id)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Rated game</p>
                <p className="text-xs text-muted-foreground">Affects ratings when the game finishes.</p>
              </div>
              <Switch checked={rated} onCheckedChange={setRated} aria-label="Rated game" />
            </div>

            <Button size="lg" className="w-full" onClick={createGame} disabled={creating}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              {creating ? "Creating…" : "Create game"}
            </Button>

            {inviteUrl && (
              <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="text-sm font-medium">Game created — invite your opponent</p>
                <div className="flex gap-2">
                  <Input readOnly value={inviteUrl} aria-label="Invite link" onFocus={(event) => event.currentTarget.select()} />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      await navigator.clipboard.writeText(inviteUrl);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1500);
                    }}
                    aria-label="Copy invite link"
                  >
                    {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Anyone with this link can join as your opponent.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeSection === "join" && (
        <Card>
          <CardHeader>
            <CardTitle>Join a game</CardTitle>
            <CardDescription>Paste a game link or ID sent to you by a friend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-input">Game link or ID</Label>
              <Input
                id="join-input"
                placeholder="https://…/game/abc123 or abc123"
                value={joinInput}
                onChange={(event) => {
                  setJoinInput(event.target.value);
                  setJoinError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") joinGame();
                }}
                aria-invalid={Boolean(joinError)}
              />
              {joinError && <p className="text-xs text-destructive">{joinError}</p>}
            </div>
            <Button size="lg" className="w-full" onClick={joinGame}>
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" /> Join game
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}