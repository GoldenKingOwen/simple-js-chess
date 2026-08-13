"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChessEngine } from "@/lib/chess/chess-engine";
import type { Color, EngineMove, PieceSymbol, Square } from "@/lib/chess/chess-engine";
import type { GameResult, TimeControl, BotDifficulty } from "@/types";
import type { ChessBot } from "@/lib/chess/bot";
import { botThinkDelay } from "@/lib/chess/bot";

export type ChessGameStatus = "playing" | "ended";

interface UseChessGameOptions {
  mode: "local" | "bot";
  timeControl: TimeControl;
  /** Optional bot instance; when set the bot will respond automatically. */
  bot?: ChessBot | null;
  botColor?: Color;
  botDifficulty?: BotDifficulty;
  /** FEN to start from (used by tests / custom positions). */
  initialFen?: string;
  onGameOver?: (info: { result: GameResult; moves: EngineMove[] }) => void;
  /** React to a bot move being applied (e.g. analytics / move sound). */
  onBotMove?: (move: EngineMove) => void;
}

export interface ChessGameApi {
  engine: ChessEngine | null;
  fen: string;
  moves: EngineMove[];
  turn: Color;
  lastMove: { from: Square; to: Square } | null;
  status: ChessGameStatus;
  result: GameResult | null;
  checkSquare: Square | null;
  whiteMs: number;
  blackMs: number;
  activeClock: Color | null;
  botThinking: boolean;
  drawOfferedBy: Color | null;
  makeMove: (from: Square, to: Square, promotion?: PieceSymbol) => void;
  resign: () => void;
  offerDraw: () => void;
  acceptDraw: () => void;
  declineDraw: () => void;
  takeback: () => void;
  newGame: () => void;
}

/**
 * Drives a full local or bot game: engine state, clocks, resign/draw flows and
 * (for bot mode) automatic bot replies. Pure client logic — no backend calls.
 */
export function useChessGame(options: UseChessGameOptions): ChessGameApi {
  const { timeControl, bot, botColor = "b", initialFen, onGameOver, onBotMove } = options;

  // The engine instance never changes identity for the life of the hook.
  const [engine] = useState(() => (initialFen ? new ChessEngine(initialFen) : new ChessEngine()));

  const [fen, setFen] = useState(() => engine.fen());
  // Refs for time-accurate clock ticking.
  const movesRef = useRef<EngineMove[]>([]);
  const whiteMsRef = useRef(timeControl.timeMs);
  const blackMsRef = useRef(timeControl.timeMs);
  const activeClockRef = useRef<Color | null>("w");
  const lastTickRef = useRef<number>(0);
  const statusRef = useRef<ChessGameStatus>("playing");

  const [moves, setMoves] = useState<EngineMove[]>([]);
  const [turn, setTurn] = useState<Color>(() => engine.turn());
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [status, setStatus] = useState<ChessGameStatus>("playing");
  const [result, setResult] = useState<GameResult | null>(null);
  const [checkSquare, setCheckSquare] = useState<Square | null>(null);
  const [whiteMs, setWhiteMs] = useState(timeControl.timeMs);
  const [blackMs, setBlackMs] = useState(timeControl.timeMs);
  const [botThinking, setBotThinking] = useState(false);
  const [drawOfferedBy, setDrawOfferedBy] = useState<Color | null>(null);

  const botColorRef = useRef(botColor);
  const botRef = useRef(bot);
  const onBotMoveRef = useRef(onBotMove);
  const onGameOverRef = useRef(onGameOver);
  // Guards against scheduling two bot replies at once (start + applyMove paths).
  const botPendingRef = useRef(false);

  // Keep the latest props available to timeouts and the interval callback.
  useEffect(() => {
    botRef.current = bot;
    onBotMoveRef.current = onBotMove;
    onGameOverRef.current = onGameOver;
  });

  const syncClockState = useCallback(() => {
    setWhiteMs(Math.max(0, Math.round(whiteMsRef.current)));
    setBlackMs(Math.max(0, Math.round(blackMsRef.current)));
  }, []);

  const finishGame = useCallback((result: GameResult) => {
    statusRef.current = "ended";
    activeClockRef.current = null;
    setStatus("ended");
    setResult(result);
    setCheckSquare(null);
    onGameOverRef.current?.({ result, moves: movesRef.current });
  }, []);

  // Lets the memoized applyMove hand bot replies back to itself.
  const applyMoveRef = useRef<(move: EngineMove) => void>(() => undefined);

  /** Schedule the bot's reply if it is the bot's turn to move. */
  const triggerBot = useCallback(() => {
    if (statusRef.current !== "playing") return;
    if (!botRef.current || engine.turn() !== botColorRef.current) return;
    if (botPendingRef.current) return;

    botPendingRef.current = true;
    setBotThinking(true);
    const difficulty = options.botDifficulty;
    const delay = botThinkDelay(difficulty ?? "medium");
    const botMoveFen = engine.fen();
    const currentBot = botRef.current;
    window.setTimeout(() => {
      currentBot
        .getMove(botMoveFen)
        .then((san) => {
          botPendingRef.current = false;
          if (statusRef.current !== "playing") return;
          const botMove = engine.moveFromSan(san);
          if (!botMove) return;
          onBotMoveRef.current?.(botMove);
          setBotThinking(false);
          applyMoveRef.current(botMove);
        })
        .catch(() => {
          setBotThinking(false);
          botPendingRef.current = false;
        });
    }, delay);
  }, [engine, options.botDifficulty]);

  const applyMove = useCallback(
    (move: EngineMove) => {
      if (statusRef.current !== "playing") return;

      // Increment for the mover's clock.
      if (move.color === "w") {
        whiteMsRef.current += timeControl.incrementMs;
      } else {
        blackMsRef.current += timeControl.incrementMs;
      }

      movesRef.current = [...movesRef.current, move];
      setMoves(movesRef.current);
      setLastMove({ from: move.from, to: move.to });
      setFen(engine.fen());
      setTurn(engine.turn());
      setCheckSquare(engine.isCheck() ? engine.kingSquareInCheck() : null);
      setDrawOfferedBy(null);

      // Switch the running clock to the side to move.
      activeClockRef.current = engine.turn();
      lastTickRef.current = performance.now();

      if (engine.isGameOver()) {
        const engineResult = engine.result();
        const gameResult: GameResult =
          engineResult.winner === null
            ? {
                winner: null,
                outcome:
                  engineResult.reason === "stalemate"
                    ? "stalemate"
                    : engineResult.reason === "insufficient-material"
                      ? "insufficient-material"
                      : engineResult.reason === "fifty-move"
                        ? "fifty-move"
                        : "repetition",
              }
            : { winner: engineResult.winner, outcome: "checkmate" };
        finishGame(gameResult);
        return;
      }

      // Trigger the bot when it is its turn.
      triggerBot();
    },
    [finishGame, engine, timeControl.incrementMs, triggerBot],
  );

  // Latest callback identity for the bot reply loop.
  useEffect(() => {
    applyMoveRef.current = applyMove;
  });

  // Kick off the bot when it is to move at the start of a game (player chose
  // black) or right after a restart. The pending guard in `triggerBot` makes
  // this idempotent with the inline trigger inside `applyMove`.
  useEffect(() => {
    triggerBot();
  }, [turn, triggerBot]);

  // Clock interval.
  useEffect(() => {
    lastTickRef.current = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      const running = activeClockRef.current;
      if (statusRef.current !== "playing" || running === null) return;

      if (running === "w") {
        whiteMsRef.current -= elapsed;
        if (whiteMsRef.current <= 0) {
          whiteMsRef.current = 0;
          finishGame({ winner: "b", outcome: "timeout" });
        }
      } else {
        blackMsRef.current -= elapsed;
        if (blackMsRef.current <= 0) {
          blackMsRef.current = 0;
          finishGame({ winner: "w", outcome: "timeout" });
        }
      }
      syncClockState();
    }, 250);

    return () => window.clearInterval(interval);
  }, [finishGame, syncClockState]);

  const makeMove = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol) => {
      if (statusRef.current !== "playing") return;
      if (engine.turn() === botColorRef.current && botRef.current) return;
      try {
        applyMove(engine.move({ from, to, promotion }));
      } catch {
        // Illegal move — ignore.
      }
    },
    [applyMove, engine],
  );

  const resign = useCallback(() => {
    if (statusRef.current !== "playing") return;
    const resigner = engine.turn();
    finishGame({ winner: resigner === "w" ? "b" : "w", outcome: "resignation" });
  }, [engine, finishGame]);

  const offerDraw = useCallback(() => {
    if (statusRef.current !== "playing") return;
    setDrawOfferedBy(engine.turn());
  }, [engine]);

  const acceptDraw = useCallback(() => {
    finishGame({ winner: null, outcome: "agreement" });
  }, [finishGame]);

  const declineDraw = useCallback(() => {
    setDrawOfferedBy(null);
  }, []);

  const takeback = useCallback(() => {
    if (statusRef.current !== "playing") return;
    // In bot mode, remove the bot's reply first, then the player's move.
    const botPlaying = botRef.current && engine.history().length > 0;
    engine.undo();
    if (botPlaying) {
      if (engine.turn() === botColorRef.current) engine.undo();
    }
    const history = engine.history();
    setMoves(history);
    movesRef.current = history;
    setFen(engine.fen());
    setTurn(engine.turn());
    setLastMove(history.length > 0 ? { from: history[history.length - 1].from, to: history[history.length - 1].to } : null);
    setDrawOfferedBy(null);
    activeClockRef.current = engine.turn();
    lastTickRef.current = performance.now();
  }, [engine]);

  const newGame = useCallback(() => {
    engine.reset();
    whiteMsRef.current = timeControl.timeMs;
    blackMsRef.current = timeControl.timeMs;
    activeClockRef.current = "w";
    lastTickRef.current = performance.now();
    statusRef.current = "playing";
    setMoves([]);
    movesRef.current = [];
    setFen(engine.fen());
    setTurn("w");
    setLastMove(null);
    setStatus("playing");
    setResult(null);
    setCheckSquare(null);
    setDrawOfferedBy(null);
    setBotThinking(false);
    syncClockState();
  }, [engine, timeControl.timeMs, syncClockState]);

  // The visible clock mirrors the side to move while the game is live.
  const activeClock: Color | null = status === "playing" ? turn : null;

  return {
    engine,
    fen,
    moves,
    turn,
    lastMove,
    status,
    result,
    checkSquare,
    whiteMs,
    blackMs,
    activeClock,
    botThinking,
    drawOfferedBy,
    makeMove,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    takeback,
    newGame,
  };
}