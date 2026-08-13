import type { Color, PieceSymbol, Square } from "./chess-engine";

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export const ALL_SQUARES: Square[] = (() => {
  const squares: Square[] = [];
  for (const rank of [...RANKS].reverse()) {
    for (const file of FILES) {
      squares.push(`${file}${rank}` as Square);
    }
  }
  return squares;
})();

export const WHITE_KING_SQUARE: Square = "e1";
export const BLACK_KING_SQUARE: Square = "e8";

/** Split a square into its file letter and rank number, e.g. "e4" → ["e", "4"]. */
export function splitSquare(square: Square): [File, Rank] {
  return [square[0] as File, square[1] as Rank];
}

export type File = (typeof FILES)[number];
export type Rank = (typeof RANKS)[number];

/** Index of a file letter (a=0 … h=7). */
export function fileIndex(file: File): number {
  return FILES.indexOf(file);
}

/** Rank number (1-8) as an integer. */
export function rankNumber(rank: Rank): number {
  return Number(rank);
}

export function fileFromIndex(index: number): File {
  return FILES[index];
}

export function rankFromNumber(number: number): Rank {
  return String(number) as Rank;
}

/** Build a square from file/rank indices, e.g. (4, 1) → "e2". */
export function squareFromIndices(fileIdx: number, rankIdx: number): Square | null {
  if (fileIdx < 0 || fileIdx > 7 || rankIdx < 0 || rankIdx > 7) return null;
  return `${FILES[fileIdx]}${rankIdx + 1}` as Square;
}

/**
 * Unicode glyphs for each piece (used as screen-reader accessible labels,
 * fallbacks and the standard glyph piece set).
 */
export const PIECE_GLYPHS: Record<Color, Record<PieceSymbol, string>> = {
  w: {
    k: "♔",
    q: "♕",
    r: "♖",
    b: "♗",
    n: "♘",
    p: "♙",
  },
  b: {
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
  },
};

export const PIECE_NAMES: Record<PieceSymbol, string> = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};

/** Human readable piece label, e.g. "White knight". */
export function pieceLabel(color: Color, piece: PieceSymbol): string {
  return `${color === "w" ? "White" : "Black"} ${PIECE_NAMES[piece]}`;
}

/** Chess.js `Move.flags` helpers. */
export const FLAGS = {
  normal: "n",
  capture: "c",
  bigPawn: "b",
  epCapture: "e",
  promotion: "p",
  kingsideCastle: "k",
  queensideCastle: "q",
} as const;

export function isCapture(flags: string): boolean {
  return flags.includes(FLAGS.capture) || flags.includes(FLAGS.epCapture);
}

export function isCastling(flags: string): boolean {
  return flags.includes(FLAGS.kingsideCastle) || flags.includes(FLAGS.queensideCastle);
}

export function toAlgebraic(square: Square): string {
  return square;
}