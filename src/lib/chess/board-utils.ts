import type { Color, Square } from "./chess-engine";
import { FILES, fileIndex, rankFromNumber, rankNumber, splitSquare, squareFromIndices } from "./move-utils";

export interface BoardPosition {
  square: Square;
  piece: { type: "p" | "n" | "b" | "r" | "q" | "k"; color: Color } | null;
}

/**
 * Renders the board as an 8×8 array ordered for display.
 *
 * `flip=false` renders rank 8 at the top (white perspective);
 * `flip=true` renders rank 1 at the top (black perspective).
 */
export function renderBoard(
  board: ({ square: Square; type: "p" | "n" | "b" | "r" | "q" | "k"; color: Color } | null)[][],
  flip = false,
): BoardPosition[][] {
  // Compute a square name for every cell — including empty ones — so keys stay
  // unique and overlays/coloring can look up squares on empty cells too.
  const display = board.map((rank, rowIndex) =>
    rank.map((square, colIndex) => ({
      square: square?.square ?? (squareFromIndices(colIndex, 7 - rowIndex) as Square),
      piece: square ? { type: square.type, color: square.color } : null,
    })),
  );
  return flip ? display.reverse() : display;
}

/**
 * Map of legal target squares for the piece on `from`. When `from` is empty or
 * belongs to the side NOT to move, an empty map is returned.
 */
export function legalMovesMap(
  engine: {
    turn(): Color;
    movesBySquare(square?: Square): { from: Square; to: Square; flags: string; captured?: string }[];
  },
  from: Square,
): Map<string, { to: Square; flags: string; captured?: string }> {
  const piece = engine.movesBySquare(from);
  const map = new Map<string, { to: Square; flags: string; captured?: string }>();
  if (piece.length === 0) return map;
  for (const move of piece) {
    if (move.from !== from) continue;
    map.set(move.to, { to: move.to, flags: move.flags, captured: move.captured });
  }
  return map;
}

/** Whether the side to move currently has the king in check. */
export function isSquareInCheck(engine: { isCheck(): boolean }): boolean {
  return engine.isCheck();
}

/** Compute display coordinates on a flipped or unflipped board. */
export function coordinates(flip = false): { files: string[]; ranks: string[] } {
  return {
    files: [...FILES],
    ranks: (flip ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).map((r) =>
      rankFromNumber(r),
    ),
  };
}

/** Whether a square should be dark on an unflipped board. */
export function isDarkSquare(square: Square): boolean {
  const [file, rank] = splitSquare(square);
  return (fileIndex(file) + rankNumber(rank)) % 2 === 1;
}

/** Parse an algebraic square like "e4" and return file/rank indices. */
export function squareToIndices(square: Square): { file: number; rank: number } {
  const [file, rank] = splitSquare(square);
  return { file: fileIndex(file), rank: rankNumber(rank) };
}

export function squareFromRowCol(row: number, col: number, flip: boolean): Square | null {
  const rankIdx = flip ? 7 - row : row;
  const fileIdx = col;
  return squareFromIndices(fileIdx, rankIdx);
}

/** Accessibility label for a square, e.g. "White king on e1". */
export function squareLabel(square: Square, pieceLabel: string | null): string {
  return pieceLabel ? `${pieceLabel} on ${square}` : `Empty square ${square}`;
}

export function oppositeColor(color: Color): Color {
  return color === "w" ? "b" : "w";
}