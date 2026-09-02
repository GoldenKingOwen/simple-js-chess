import bookData from "./openings-book.json";

export interface OpeningMatch {
  eco: string;
  name: string;
  /** Number of plies (half-moves) of the matched line. */
  matchedPly: number;
}

interface BookEntry {
  eco: string;
  name: string;
}

const BOOK = bookData.book as Record<string, BookEntry>;
const MAX_PLY = bookData.maxPly;

/**
 * Given the SAN moves played so far, return the deepest known opening whose move
 * sequence is a prefix of the game, or `null` if the game has never matched any
 * book line. Pure and synchronous — safe to call after every move.
 *
 * When a game leaves book after matching, this returns the last matching prefix
 * (not `null`); callers that want the "freeze on last confident match" behaviour
 * keep the previous non-null result instead of overwriting it with a null.
 *
 * Mirror of `chess-backend/src/openings/opening-detector.ts` — keep in sync.
 */
export function detectOpening(sanMoves: string[]): OpeningMatch | null {
  for (let ply = Math.min(sanMoves.length, MAX_PLY); ply >= 1; ply--) {
    const hit = BOOK[sanMoves.slice(0, ply).join(" ")];
    if (hit) return { eco: hit.eco, name: hit.name, matchedPly: ply };
  }
  return null;
}
