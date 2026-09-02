"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Dices, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GameScreen } from "@/components/game/game-screen";
import { useChessGame } from "@/hooks/use-chess-game";
import { getTimeControl, TIME_CONTROL_LIST } from "@/config/time-controls";
import type { GamePlayerSlot } from "@/stores/game-store";
import type { ResolvedMove } from "@/components/chess/chess-board";
import type { Color } from "@/lib/chess/chess-engine";
import { sounds } from "@/lib/sound/sound-manager";

const setupSchema = z.object({
  player1: z.string().trim().min(1, "Player 1 name is required").max(24),
  player2: z.string().trim().min(1, "Player 2 name is required").max(24),
  timeControlId: z.enum(["bullet", "blitz", "rapid", "classical"] as const),
});

type SetupValues = z.infer<typeof setupSchema>;

interface LocalConfig {
  whiteName: string;
  blackName: string;
  timeControlId: "bullet" | "blitz" | "rapid" | "classical";
}

const slotFor = (username: string, color: Color, online = false): GamePlayerSlot => ({
  user: null,
  username,
  avatarUrl: null,
  rating: null,
  title: null,
  online,
  color,
});

export function LocalGame() {
  const router = useRouter();
  const [config, setConfig] = useState<LocalConfig | null>(null);

  const form = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      player1: "Player 1",
      player2: "Player 2",
      timeControlId: "rapid",
    },
  });

  const startGame = (values: SetupValues) => {
    const randomize = crypto.getRandomValues(new Uint32Array(1))[0] % 2 === 0;
    setConfig({
      whiteName: randomize ? values.player2 : values.player1,
      blackName: randomize ? values.player1 : values.player2,
      timeControlId: values.timeControlId,
    });
  };

  if (!config) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => router.push("/play")}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to play
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" aria-hidden="true" /> Local game
            </CardTitle>
            <CardDescription>
              Two players, one screen. Everything runs locally — no account or backend needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(startGame)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="player1">Player 1</Label>
                  <Input id="player1" {...form.register("player1")} placeholder="White player" />
                  {form.formState.errors.player1 && (
                    <p className="text-xs text-destructive">{form.formState.errors.player1.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="player2">Player 2</Label>
                  <Input id="player2" {...form.register("player2")} placeholder="Black player" />
                  {form.formState.errors.player2 && (
                    <p className="text-xs text-destructive">{form.formState.errors.player2.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Time control</span>
                <RadioGroup
                  defaultValue="rapid"
                  onValueChange={(value) => form.setValue("timeControlId", value as LocalConfig["timeControlId"])}
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TIME_CONTROL_LIST.map((tc) => (
                      <Label
                        key={tc.id}
                        htmlFor={`tc-${tc.id}`}
                        className="flex cursor-pointer flex-col items-center gap-0.5 rounded-lg border p-2 text-center hover:bg-accent/40 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
                      >
                        <RadioGroupItem value={tc.id} id={`tc-${tc.id}`} className="peer sr-only" />
                        <span className="font-medium">{tc.label}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {tc.timeMs / 60000} min{tc.incrementMs ? ` + ${tc.incrementMs / 1000}` : ""}
                        </span>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" size="lg" className="w-full">
                <Dices className="mr-2 h-4 w-4" aria-hidden="true" />
                Start game
              </Button>
              <p className="text-center text-xs text-muted-foreground">Colors are assigned randomly each game.</p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <LocalMatch
      key={`${config.whiteName}-${config.blackName}-${config.timeControlId}`}
      config={config}
    />
  );
}

function LocalMatch({ config }: { config: LocalConfig }) {
  const router = useRouter();
  const timeControl = getTimeControl(config.timeControlId);

  const game = useChessGame({
    mode: "local",
    timeControl,
    onGameOver: () => sounds.gameEnd(),
  });

  const handleMove = useCallback(
    (move: ResolvedMove) => {
      const engine = game.engine;
      if (!engine) return;
      const legal = engine.movesBySquare(move.from).find((m) => m.to === move.to);
      if (!legal) return;
      if (legal.flags.includes("c") || legal.flags.includes("e")) sounds.capture();
      else sounds.move();
      game.makeMove(move.from, move.to, move.promotion);
    },
    [game],
  );

  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-4 sm:px-6 lg:px-0 lg:py-6">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.push("/play")}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Exit
        </Button>
      </div>
      <GameScreen
        gameId={`local-${timeControl.id}`}
        white={slotFor(config.whiteName, "w")}
        black={slotFor(config.blackName, "b")}
        whiteMs={game.whiteMs}
        blackMs={game.blackMs}
        activeClock={game.activeClock}
        fen={game.fen}
        moves={game.moves}
        turn={game.turn}
        interaction="play"
        status={game.status}
        result={game.result}
        checkSquare={game.checkSquare}
        opening={game.opening}
        drawOffered={game.drawOfferedBy !== null}
        drawReceived={game.drawOfferedBy !== null}
        onMove={handleMove}
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