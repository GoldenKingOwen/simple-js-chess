"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { GameScreen } from "@/components/game/game-screen";
import { useChessGame } from "@/hooks/use-chess-game";
import { LocalChessBot, botName } from "@/lib/chess/bot";
import { gameService } from "@/services/game-service";
import { useAuthStore } from "@/stores/auth-store";
import { getTimeControl, TIME_CONTROL_LIST, timeControlLabel } from "@/config/time-controls";
import type { Color } from "@/lib/chess/chess-engine";
import type { BotDifficulty, TimeControlId } from "@/types";
import type { GamePlayerSlot } from "@/stores/game-store";
import { sounds } from "@/lib/sound/sound-manager";

const DIFFICULTIES: { id: BotDifficulty; label: string; hint: string; rating: number }[] = [
  { id: "beginner", label: "Beginner", hint: "Barely thinks", rating: 400 },
  { id: "easy", label: "Easy", hint: "Good for warm-ups", rating: 800 },
  { id: "medium", label: "Medium", hint: "A solid club player", rating: 1200 },
  { id: "hard", label: "Hard", hint: "Fights for every point", rating: 1600 },
  { id: "expert", label: "Expert", hint: "Full-strength Stockfish", rating: 2000 },
];

interface BotConfig {
  difficulty: BotDifficulty;
  playerColor: Color;
  timeControlId: TimeControlId;
  noClock: boolean;
}

export function BotGame() {
  const router = useRouter();
  const isAuthed = useAuthStore((state) => Boolean(state.token));

  const [config, setConfig] = useState<BotConfig | null>(null);
  const [difficulty, setDifficulty] = useState<BotDifficulty>("medium");
  const [playerColor, setPlayerColor] = useState<Color>("w");
  const [timeControlId, setTimeControlId] = useState<TimeControlId>("rapid");
  // Server bot = a real, persisted GameMode.BOT game played through the
  // authoritative backend (Stockfish). Practice = the offline client bot; it is
  // never saved and does not touch your rating.
  const [practice, setPractice] = useState(false);
  const [noClock, setNoClock] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const startGame = useCallback(async () => {
    if (practice) {
      setConfig({ difficulty, playerColor, timeControlId, noClock });
      return;
    }
    if (!isAuthed) {
      router.push(`/login?redirect=${encodeURIComponent("/play/bot")}`);
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const game = await gameService.createGame({
        mode: "bot",
        timeControlId,
        timeControl: noClock ? "unlimited" : undefined,
        rated: false,
        colorPreference: playerColor,
        botDifficulty: difficulty,
      });
      router.push(`/game/${game.id}`);
    } catch {
      setCreateError("Could not start the bot game. Check your connection and try again.");
      setCreating(false);
    }
  }, [practice, noClock, isAuthed, difficulty, playerColor, timeControlId, router]);

  if (!config) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => router.push("/play")}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to play
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" aria-hidden="true" /> Play the bot
            </CardTitle>
            <CardDescription>Pick a difficulty, your color and a time control to begin.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="space-y-2">
                <span className="text-sm font-medium">Difficulty</span>
                <RadioGroup value={difficulty} onValueChange={(value) => setDifficulty(value as BotDifficulty)}>
                  <div className="grid gap-2">
                    {DIFFICULTIES.map((level) => (
                      <Label
                        key={level.id}
                        htmlFor={`difficulty-${level.id}`}
                        className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 hover:bg-accent/40 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
                      >
                        <span className="flex items-center gap-3">
                          <RadioGroupItem value={level.id} id={`difficulty-${level.id}`} className="peer sr-only" />
                          <span className="font-medium">{level.label}</span>
                          <span className="text-xs text-muted-foreground">{level.hint}</span>
                        </span>
                        <span className="text-xs font-semibold tabular-nums">{level.rating}</span>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Play as</span>
                <RadioGroup value={playerColor} onValueChange={(value) => setPlayerColor(value as Color)}>
                  <div className="grid grid-cols-2 gap-2">
                    <Label htmlFor="color-w" className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2.5 hover:bg-accent/40 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
                      <RadioGroupItem value="w" id="color-w" className="peer sr-only" />
                      <span className="inline-block h-3 w-3 rounded-full border" /> White
                    </Label>
                    <Label htmlFor="color-b" className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2.5 hover:bg-accent/40 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
                      <RadioGroupItem value="b" id="color-b" className="peer sr-only" />
                      <span className="inline-block h-3 w-3 rounded-full bg-foreground" /> Black
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tc">Time control</Label>
                <select
                  id="tc"
                  value={timeControlId}
                  disabled={noClock}
                  onChange={(event) => setTimeControlId(event.target.value as TimeControlId)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {TIME_CONTROL_LIST.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {timeControlLabel(tc.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border px-3 py-2.5">
                <div className="space-y-0.5">
                  <Label htmlFor="no-clock" className="font-medium">
                    No clock
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Play without a time control — take as long as you like on every move.
                  </p>
                </div>
                <Switch id="no-clock" checked={noClock} onCheckedChange={setNoClock} aria-label="No clock" />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border px-3 py-2.5">
                <div className="space-y-0.5">
                  <Label htmlFor="practice-mode" className="font-medium">
                    Practice mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Play offline against the lightweight local bot. Nothing is saved. Turn this
                    off for a real game against server-side Stockfish.
                  </p>
                </div>
                <Switch
                  id="practice-mode"
                  checked={practice}
                  onCheckedChange={setPractice}
                  aria-label="Practice mode"
                />
              </div>

              {createError && (
                <p className="text-sm font-medium text-destructive" role="alert">
                  {createError}
                </p>
              )}

              <Button type="button" size="lg" className="w-full" onClick={startGame} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Starting…
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" aria-hidden="true" />
                    {practice ? "Start practice game" : "Start bot game"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <BotMatch
      key={`${config.difficulty}-${config.playerColor}-${config.timeControlId}-${config.noClock}`}
      config={config}
    />
  );
}

/**
 * Offline "practice" match against {@link LocalChessBot}. The real, persisted bot
 * game is the online game screen at `/game/:id` — see {@link BotGame}.
 */
function BotMatch({ config }: { config: BotConfig }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const baseTimeControl = getTimeControl(config.timeControlId);
  const timeControl = config.noClock
    ? { ...baseTimeControl, label: "Unlimited", timeMs: 0, incrementMs: 0 }
    : baseTimeControl;
  const botColor: Color = config.playerColor === "w" ? "b" : "w";
  const difficulty = DIFFICULTIES.find((level) => level.id === config.difficulty)!;
  const bot = new LocalChessBot(config.difficulty, botColor);

  const onBotMove = useCallback(() => {
    sounds.capture();
  }, []);

  const game = useChessGame({
    mode: "bot",
    timeControl,
    bot,
    botColor,
    botDifficulty: config.difficulty,
    onBotMove,
  });

  const playerSlot: GamePlayerSlot = {
    user,
    username: user?.username ?? "You",
    avatarUrl: user?.avatarUrl ?? null,
    rating: user?.rating ?? null,
    title: user?.title ?? null,
    online: true,
    color: config.playerColor,
  };
  const botSlot: GamePlayerSlot = {
    user: null,
    username: `${botName(config.difficulty)} (practice)`,
    avatarUrl: null,
    rating: difficulty.rating,
    title: null,
    online: true,
    color: botColor,
  };

  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-4 sm:px-6 lg:px-0 lg:py-6">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.push("/play")}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Exit
        </Button>
      </div>
      <GameScreen
        gameId={`bot-${config.difficulty}`}
        white={config.playerColor === "w" ? playerSlot : botSlot}
        black={config.playerColor === "b" ? playerSlot : botSlot}
        whiteMs={game.whiteMs}
        blackMs={game.blackMs}
        activeClock={game.activeClock}
        untimed={config.noClock}
        fen={game.fen}
        moves={game.moves}
        turn={game.turn}
        interaction={config.playerColor === "w" ? "white-only" : "black-only"}
        status={game.status}
        result={game.result}
        checkSquare={game.checkSquare}
        opening={game.opening}
        botThinking={game.botThinking}
        drawOffered={game.drawOfferedBy === config.playerColor}
        drawReceived={game.drawOfferedBy !== null && game.drawOfferedBy !== config.playerColor}
        onMove={(move) => game.makeMove(move.from, move.to, move.promotion)}
        onResign={game.resign}
        onOfferDraw={game.offerDraw}
        onAcceptDraw={game.acceptDraw}
        onDeclineDraw={game.declineDraw}
        onTakeback={game.takeback}
        onNewGame={game.newGame}
        onBackToDashboard={() => router.push("/dashboard")}
      />
    </>
  );
}
