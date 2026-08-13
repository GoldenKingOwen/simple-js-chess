"use client";

import { create } from "zustand";
import type { Color, EngineMove, Square } from "@/lib/chess/chess-engine";
import { WHITE_KING_SQUARE, BLACK_KING_SQUARE } from "@/lib/chess/move-utils";
import type {
  ConnectionStatus,
  GameMode,
  GameResult,
  GameStatus,
  TimeControlId,
  User,
} from "@/types";

export const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export interface GamePlayerSlot {
  user: User | null;
  username: string;
  avatarUrl: string | null;
  rating: number | null;
  title: string | null;
  online: boolean;
  color: Color;
}

interface GameStoreState {
  gameId: string | null;
  mode: GameMode | null;
  timeControlId: TimeControlId | null;
  rated: boolean;
  status: GameStatus;
  result: GameResult | null;

  fen: string;
  pgn: string;
  moves: EngineMove[];
  /** Side to move in the current (or last) position. */
  turn: Color;

  white: GamePlayerSlot | null;
  black: GamePlayerSlot | null;
  /** Last move (from → to) used for board highlighting. */
  lastMove: { from: Square; to: Square } | null;
  /** Which color(s) the current user can play. Empty for spectators. */
  playableColors: Color[];

  connection: ConnectionStatus;
  whiteMs: number;
  blackMs: number;
  /** user id of whoever currently has a pending draw offer. */
  drawOfferBy: string | null;

  flipped: boolean;

  setupGame: (config: {
    gameId?: string;
    mode: GameMode;
    timeControlId: TimeControlId | null;
    rated?: boolean;
    white: GamePlayerSlot;
    black: GamePlayerSlot;
    playableColors?: Color[];
    timeControlMs: number;
    fen?: string;
  }) => void;
  loadGame: (game: {
    id: string;
    mode: GameMode;
    status: GameStatus;
    result: GameResult | null;
    fen: string;
    pgn: string;
    moves: EngineMove[];
    turn: Color;
    timeControlId: TimeControlId | null;
    rated: boolean;
    whiteMs: number;
    blackMs: number;
    white: GamePlayerSlot;
    black: GamePlayerSlot;
    playableColors?: Color[];
  }) => void;
  pushMove: (move: EngineMove) => void;
  undoLastMove: () => void;
  setFen: (fen: string, turn: Color, lastMove?: { from: Square; to: Square } | null) => void;
  setResult: (result: GameResult) => void;
  setStatus: (status: GameStatus) => void;
  setTurn: (turn: Color) => void;
  setClocks: (whiteMs: number, blackMs: number) => void;
  setConnection: (connection: ConnectionStatus) => void;
  setDrawOfferBy: (userId: string | null) => void;
  setLastMove: (move: { from: Square; to: Square } | null) => void;
  toggleFlip: () => void;
  updatePlayer: (color: Color, patch: Partial<GamePlayerSlot>) => void;
  resetGame: () => void;
}

const emptySlot = (color: Color): GamePlayerSlot => ({
  user: null,
  username: color === "w" ? "White" : "Black",
  avatarUrl: null,
  rating: null,
  title: null,
  online: false,
  color,
});

export const useGameStore = create<GameStoreState>((set) => ({
  gameId: null,
  mode: null,
  timeControlId: null,
  rated: false,
  status: "waiting",
  result: null,
  fen: STARTING_FEN,
  pgn: "",
  moves: [],
  turn: "w",
  white: emptySlot("w"),
  black: emptySlot("b"),
  lastMove: null,
  playableColors: [],
  connection: "disconnected",
  whiteMs: 0,
  blackMs: 0,
  drawOfferBy: null,
  flipped: false,

  setupGame: (config) =>
    set({
      gameId: config.gameId ?? null,
      mode: config.mode,
      timeControlId: config.timeControlId,
      rated: config.rated ?? false,
      status: "active",
      result: null,
      fen: config.fen ?? STARTING_FEN,
      pgn: "",
      moves: [],
      turn: "w",
      white: config.white,
      black: config.black,
      playableColors: config.playableColors ?? (config.mode === "local" ? ["w", "b"] : []),
      whiteMs: config.timeControlMs,
      blackMs: config.timeControlMs,
      drawOfferBy: null,
      lastMove: null,
      flipped: false,
    }),

  loadGame: (game) =>
    set({
      gameId: game.id,
      mode: game.mode,
      status: game.status,
      result: game.result,
      fen: game.fen,
      pgn: game.pgn,
      moves: game.moves,
      turn: game.turn,
      timeControlId: game.timeControlId,
      rated: game.rated,
      whiteMs: game.whiteMs,
      blackMs: game.blackMs,
      white: game.white,
      black: game.black,
      playableColors: game.playableColors ?? [],
    }),

  pushMove: (move) =>
    set((state) => ({
      moves: [...state.moves, move],
      fen: move.after || state.fen,
      turn: (move.color === "w" ? "b" : "w") as Color,
      lastMove: { from: move.from, to: move.to },
    })),

  undoLastMove: () =>
    set((state) => {
      const moves = state.moves.slice(0, -1);
      const prev = moves[moves.length - 1];
      return {
        moves,
        turn: state.turn === "w" ? "b" : "w",
        fen: prev ? prev.after : STARTING_FEN,
        lastMove: prev ? { from: prev.from, to: prev.to } : null,
      };
    }),

  setFen: (fen, turn, lastMove) => set({ fen, turn, lastMove: lastMove ?? null }),
  setResult: (result) => set({ result, status: "ended" }),
  setStatus: (status) => set({ status }),
  setTurn: (turn) => set({ turn }),
  setClocks: (whiteMs, blackMs) => set({ whiteMs, blackMs }),
  setConnection: (connection) => set({ connection }),
  setDrawOfferBy: (drawOfferBy) => set({ drawOfferBy }),
  setLastMove: (lastMove) => set({ lastMove }),
  toggleFlip: () => set((state) => ({ flipped: !state.flipped })),
  updatePlayer: (color, patch) =>
    set((state) => ({
      white: color === "w" ? { ...state.white!, ...patch } : state.white,
      black: color === "b" ? { ...state.black!, ...patch } : state.black,
    })),

  resetGame: () =>
    set({
      gameId: null,
      mode: null,
      timeControlId: null,
      rated: false,
      status: "waiting",
      result: null,
      fen: STARTING_FEN,
      pgn: "",
      moves: [],
      turn: "w",
      white: emptySlot("w"),
      black: emptySlot("b"),
      lastMove: null,
      playableColors: [],
      connection: "disconnected",
      whiteMs: 0,
      blackMs: 0,
      drawOfferBy: null,
      flipped: false,
    }),
}));

/** Current "last move" for board highlighting (uses store's lastMove). */
export const KINGS = {
  w: WHITE_KING_SQUARE,
  b: BLACK_KING_SQUARE,
} as const;