"use client";

import { useMemo, useState } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import type { GamePlayerSlot } from "@/stores/game-store";
import { ChessBoard } from "@/components/chess/chess-board";
import type { BoardInteraction } from "@/components/chess/chess-board";
import type { ResolvedMove } from "@/components/chess/chess-board";
import { PlayerPanel } from "./player-panel";
import { GameControls } from "./game-controls";
import { GameSidePanel } from "./game-side-panel";
import { GameResultScreen } from "./game-result";
import type { EngineMove, Color, Square } from "@/lib/chess/chess-engine";
import type { ChatMessage, GameResult } from "@/types";
import { cn } from "@/lib/utils";

interface GameScreenProps {
  gameId: string;
  white: GamePlayerSlot;
  black: GamePlayerSlot;
  whiteMs: number;
  blackMs: number;
  activeClock: Color | null;
  fen: string;
  moves: EngineMove[];
  turn: Color;
  interaction: BoardInteraction;
  status: "playing" | "ended";
  result: GameResult | null;
  checkSquare: Square | null;
  botThinking?: boolean;
  drawOffered?: boolean;
  drawReceived?: boolean;
  onMove: (move: ResolvedMove) => void;
  onResign?: () => void;
  onOfferDraw?: () => void;
  onAcceptDraw?: () => void;
  onDeclineDraw?: () => void;
  onTakeback?: () => void;
  onNewGame?: () => void;
  onLeave?: () => void;
  onRematch?: () => void;
  onViewAnalysis?: () => void;
  onBackToDashboard?: () => void;
  chat?: {
    messages: ChatMessage[];
    selfId: string;
    disabled?: boolean;
    onSend?: (body: string) => void;
    loading?: boolean;
    error?: string | null;
    connecting?: boolean;
  };
  /** Replay navigation (used by finished-game replay screens). */
  replay?: { activeIndex: number | null; onSelectMove: (index: number) => void };
}

/**
 * The full game layout shared by local, bot and online modes:
 *
 * Desktop  ┌──────────────────────┐  ┌──────────┐
 *          │ Opponent + clock      │  │ Moves    │
 *          │         board         │  │ Chat     │
 *          │ You + clock           │  │ Notes    │
 *          └──────────────────────┘  └──────────┘
 *
 * Mobile renders the board first, then a tabbed panel below.
 */
export function GameScreen({
  gameId,
  white,
  black,
  whiteMs,
  blackMs,
  activeClock,
  fen,
  moves,
  interaction,
  status,
  result,
  botThinking,
  drawOffered,
  drawReceived,
  onMove,
  onResign,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  onTakeback,
  onNewGame,
  onLeave,
  onRematch,
  onViewAnalysis,
  onBackToDashboard,
  chat,
  replay,
}: GameScreenProps) {
  const boardTheme = useSettingsStore((state) => state.boardTheme);
  const pieceStyle = useSettingsStore((state) => state.pieceStyle);
  const gameSettings = useSettingsStore((state) => state.game);
  const [flipped, setFlipped] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const boardIsFlipped = useMemo(() => {
    // Default orientation: user's color at the bottom when known.
    if (interaction === "white-only" || interaction === "black-only") {
      return interaction === "black-only" ? !flipped : flipped;
    }
    return flipped;
  }, [interaction, flipped]);

  const handleMove = (move: ResolvedMove) => {
    if (status !== "playing") return;
    onMove(move);
  };

  const moveCount = moves.length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:py-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Board column */}
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2 lg:mx-0">
          <PlayerPanel
            slot={black}
            active={activeClock === "b" && status === "playing"}
            timeMs={blackMs}
            className="order-1"
          />
          <div className="order-2" data-testid="chess-board">
            <ChessBoard
              fen={fen}
              flipped={boardIsFlipped}
              interaction={interaction}
              boardThemeId={boardTheme}
              pieceStyle={pieceStyle}
              showCoordinates={gameSettings.showCoordinates}
              showLegalMoves={gameSettings.showLegalMoves}
              highlightLastMove={gameSettings.highlightLastMove}
              animations={gameSettings.animations}
              autoQueen={gameSettings.autoQueen}
              lastMove={moves.length > 0 ? { from: moves[moves.length - 1].from, to: moves[moves.length - 1].to } : null}
              onMove={handleMove}
            />
            {botThinking && (
              <p className="mt-2 text-center text-xs text-muted-foreground" role="status" aria-live="polite">
                Opponent is thinking…
              </p>
            )}
          </div>
          <PlayerPanel
            slot={white}
            active={activeClock === "w" && status === "playing"}
            timeMs={whiteMs}
            className="order-3"
          />
          <GameControls
            onResign={status === "playing" ? onResign : undefined}
            onOfferDraw={status === "playing" ? onOfferDraw : undefined}
            onAcceptDraw={status === "playing" && drawReceived ? onAcceptDraw : undefined}
            onDeclineDraw={status === "playing" && drawReceived ? onDeclineDraw : undefined}
            drawOffered={drawOffered}
            drawReceived={drawReceived}
            onFlipBoard={() => setFlipped((value) => !value)}
            onTakeback={status === "playing" ? onTakeback : undefined}
            onNewGame={status === "ended" ? onNewGame : undefined}
            onLeave={onLeave}
            soundOn={soundOn}
            onToggleSound={() => setSoundOn((value) => !value)}
            gameOver={status === "ended"}
            className="order-4"
          />
        </div>

        {/* Side panel */}
        <div className={cn("hidden min-h-0 lg:block", "lg:order-5")}>
          <div className="h-[calc(100vh-8rem)] rounded-xl border bg-card/40">
            <GameSidePanel
              moves={moves}
              activeIndex={replay?.activeIndex ?? null}
              onSelectMove={replay?.onSelectMove}
              gameId={gameId}
              chat={chat}
              defaultTab={chat ? "moves" : "moves"}
              className="h-full p-2"
            />
          </div>
        </div>
      </div>

      {/* Mobile side panel */}
      <div className="mt-4 h-[420px] rounded-xl border bg-card/40 lg:hidden">
        <GameSidePanel
          moves={moves}
          activeIndex={replay?.activeIndex ?? null}
          onSelectMove={replay?.onSelectMove}
          gameId={gameId}
          chat={chat}
          className="h-full p-2"
        />
      </div>

      <GameResultScreen
        open={status === "ended" && result !== null}
        result={result ?? { winner: null, outcome: "agreement" }}
        whiteName={white.username}
        blackName={black.username}
        moveCount={moveCount}
        onRematch={onRematch}
        onNewGame={onNewGame}
        onViewAnalysis={onViewAnalysis}
        onBackToDashboard={onBackToDashboard}
      />
    </div>
  );
}