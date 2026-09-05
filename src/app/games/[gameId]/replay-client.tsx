"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChessBoard } from "@/components/chess/chess-board";
import { MoveList } from "@/components/game/move-list";
import { PgnPanel } from "@/components/game/pgn-panel";
import { EvalGraph } from "@/components/game/eval-graph";
import { UserAvatar } from "@/components/profile/user-avatar";
import { gameService } from "@/services/game-service";
import { useGameAnalysis } from "@/hooks/use-analysis";
import { useAuthStore } from "@/stores/auth-store";
import { STARTING_FEN } from "@/stores/game-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { MoveClassification } from "@/types";
import type { EngineMove, Square as ChessSquare } from "@/lib/chess/chess-engine";

export function ReplayClient({ gameId }: { gameId: string }) {
  const boardTheme = useSettingsStore((state) => state.boardTheme);
  const pieceStyle = useSettingsStore((state) => state.pieceStyle);
  const [position, setPosition] = useState(-1); // -1 = start, 0..n = after move n

  const user = useAuthStore((state) => state.user);

  const { data: game, isLoading } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => gameService.getGame(gameId),
    retry: 1,
  });

  const { analysis, isRunning, isComplete, isFailed, start } = useGameAnalysis(gameId);

  const moves = useMemo<EngineMove[]>(
    () =>
      (game?.moveHistory ?? []).map((move) => ({
        color: move.color,
        from: move.from as ChessSquare,
        to: move.to as ChessSquare,
        piece: (move.piece ?? "p") as EngineMove["piece"],
        captured: move.captured as EngineMove["captured"],
        promotion: move.promotion as EngineMove["promotion"],
        flags: move.flags,
        lan: move.uci,
        san: move.san,
        before: "",
        after: move.fen,
        isCheck: move.check ?? false,
        isCheckmate: move.checkmate ?? false,
      })),
    [game],
  );

  const total = moves.length;
  const atStart = position <= -1;
  const atEnd = position >= total - 1;

  const plies = useMemo(() => analysis?.plies ?? [], [analysis?.plies]);
  const classifications = useMemo<Record<number, MoveClassification>>(() => {
    const map: Record<number, MoveClassification> = {};
    for (const p of plies) if (p.classification !== "GOOD") map[p.ply] = p.classification;
    return map;
  }, [plies]);
  const currentPly = position >= 0 ? plies[position] : undefined;

  const fen = position === -1 ? STARTING_FEN : moves[Math.max(0, Math.min(position, total - 1))].after;
  const lastMove = position >= 0 && position < total ? { from: moves[position].from, to: moves[position].to } : null;

  const goStart = () => setPosition(-1);
  const goPrev = () => setPosition((value) => Math.max(-1, value - 1));
  const goNext = () => setPosition((value) => Math.min(total - 1, value + 1));
  const goEnd = () => setPosition(total - 1);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="mx-auto w-full max-w-[560px]">
            <Skeleton className="mb-3 h-10 w-full" />
            <Skeleton className="aspect-square w-full" />
          </div>
          <Skeleton className="h-[420px] w-full" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-xl font-semibold">Game not found</h1>
        <p className="text-sm text-muted-foreground">This game is unavailable or has been deleted.</p>
        <Button variant="outline" render={<Link href="/games" />}>
          Back to games
        </Button>
      </div>
    );
  }

  const resultText = game.result
    ? game.result.winner === null
      ? "Draw"
      : game.result.winner === "w"
        ? `${game.white.user.username} wins`
        : `${game.black.user.username} wins`
    : "In progress";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Replay · {game.rated ? "Rated" : "Casual"} · {game.timeControl.label} · {resultText}
          {game.opening?.name ? ` · ${game.opening.name} (${game.opening.eco})` : ""}
        </p>
        <h1 className="text-xl font-bold">
          {game.white.user.username} vs {game.black.user.username}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="mx-auto w-full max-w-[560px]">
          {/* Player badges */}
          <div className="mb-3 grid grid-cols-2 gap-3">
            {[game.white, game.black].map((player) => (
              <div key={player.color} className="flex items-center gap-2 rounded-lg border bg-card p-2">
                <UserAvatar user={player.user} className="h-8 w-8 text-xs" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{player.user.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {player.color === "w" ? "White" : "Black"} · {player.rating ?? "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <ChessBoard
            fen={fen}
            interaction="spectator"
            boardThemeId={boardTheme}
            pieceStyle={pieceStyle}
            lastMove={lastMove}
          />

          {/* Replay controls */}
          <div className="mt-3 flex items-center justify-center gap-1.5" role="group" aria-label="Replay controls">
            <Button variant="outline" size="icon" onClick={goStart} disabled={atStart} aria-label="Go to start">
              <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="outline" size="icon" onClick={goPrev} disabled={atStart} aria-label="Previous move">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="min-w-20 text-center font-mono text-sm tabular-nums text-muted-foreground">
              {position + 1} / {total}
            </span>
            <Button variant="outline" size="icon" onClick={goNext} disabled={atEnd} aria-label="Next move">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="outline" size="icon" onClick={goEnd} disabled={atEnd} aria-label="Go to end">
              <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Post-game analysis (finished games only; backend enforces too) */}
          {game.result ? (
            <div className="mt-4">
              {!analysis && !isRunning ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={start}
                  disabled={!user}
                  title={user ? undefined : "Log in to analyze games"}
                >
                  <BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" /> Analyze game
                </Button>
              ) : isRunning ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/30 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Analyzing every move…
                </div>
              ) : isFailed ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
                  <span className="text-destructive">Analysis failed.</span>
                  <Button size="sm" variant="outline" onClick={start}>
                    Retry
                  </Button>
                </div>
              ) : isComplete ? (
                <div className="space-y-2">
                  <EvalGraph plies={plies} position={position} onSeek={setPosition} />
                  {currentPly?.missedBest && currentPly.classification !== "GOOD" && (
                    <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs">
                      <span className="font-semibold text-amber-700">Best move was {currentPly.bestUci}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        — {currentPly.san} lost {(currentPly.cpLoss / 100).toFixed(1)} pawns
                      </span>
                    </p>
                  )}
                  <AnalysisSummary plies={plies} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Move list + PGN */}
        <div className="flex flex-col gap-4">
          <Card className="h-[340px]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-base">
                <Play className="h-4 w-4 text-primary" aria-hidden="true" /> Moves
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-3.5rem)] p-2 pt-0">
              <MoveList
                moves={moves}
                activeIndex={position}
                onSelectMove={(index) => setPosition(index)}
                classifications={isComplete ? classifications : undefined}
              />
            </CardContent>
          </Card>

          <Card className="h-[260px]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-base">
                <Square className="h-4 w-4 text-primary" aria-hidden="true" /> PGN
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-3.5rem)] p-2 pt-0">
              <PgnPanel pgn={game.pgn || moves.map((move) => move.san).join(" ")} filename={gameId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AnalysisSummary({ plies }: { plies: import("@/types").AnalyzedPly[] }) {
  const tally = (color: "WHITE" | "BLACK", cls: string) =>
    plies.filter((p) => p.color === color && p.classification === cls).length;
  const rows = [
    { label: "Inaccuracies", cls: "INACCURACY", tone: "text-amber-600" },
    { label: "Mistakes", cls: "MISTAKE", tone: "text-orange-600" },
    { label: "Blunders", cls: "BLUNDER", tone: "text-destructive" },
  ];
  return (
    <table className="w-full rounded-lg border text-xs">
      <tbody>
        {rows.map((row) => (
          <tr key={row.cls} className="border-b last:border-0">
            <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{tally("WHITE", row.cls)}</td>
            <td className={`px-2 py-1.5 text-center ${row.tone}`}>{row.label}</td>
            <td className="px-3 py-1.5 tabular-nums font-semibold">{tally("BLACK", row.cls)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}