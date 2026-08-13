import { ChessEngine } from "./chess-engine";
import type { Color, Square, PieceSymbol } from "./chess-engine";
import type { BotDifficulty } from "@/types/game";

/**
 * Contract for a chess-playing bot.
 *
 * The future NestJS backend owns the production bot engine; the frontend bot
 * (used in bot games today) implements the same interface so swapping the
 * implementation later is transparent to the UI.
 */
export interface ChessBot {
  /** Request a move for the given position (FEN). Returns a SAN move string. */
  getMove(position: string): Promise<string>;
}

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20_000,
};

/**
 * Lightweight development bot. It is a placeholder for the future NestJS
 * engine: the UI only depends on `ChessBot.getMove()`.
 *
 * The heuristic is intentionally simple (material + controlled-by-capture
 * bonus) so the placeholder is deterministic, fast and never reusable as a
 * real engine.
 */
export class LocalChessBot implements ChessBot {
  constructor(
    private difficulty: BotDifficulty,
    private color: Color,
  ) {}

  private noiseRange(): number {
    switch (this.difficulty) {
      case "beginner":
        return 500;
      case "easy":
        return 260;
      case "medium":
        return 120;
      case "hard":
        return 40;
      case "expert":
        return 0;
    }
  }

  async getMove(position: string): Promise<string> {
    const engine = new ChessEngine(position);
    const legal = engine.moves();
    if (legal.length === 0) throw new Error("No legal moves available.");

    const scored = legal.map((san) => ({
      san,
      score: this.scoreMove(position, san),
    }));

    if (this.difficulty === "beginner") {
      return legal[Math.floor(Math.random() * legal.length)];
    }

    scored.sort((a, b) => b.score - a.score);
    const noise = this.noiseRange();
    if (noise > 0 && Math.random() < 0.25) {
      const maxScore = scored[0].score;
      const slice = scored.filter((m) => maxScore - m.score < noise);
      const pool = slice.length > 0 ? slice : scored;
      return pool[Math.floor(Math.random() * pool.length)].san;
    }
    return scored[0].san;
  }

  private scoreMove(position: string, san: string): number {
    const engine = new ChessEngine(position);
    const move = engine.moveFromSan(san);
    if (!move) return -Infinity;

    let score = 0;

    // Material captured.
    if (move.captured) score += PIECE_VALUES[move.captured] ?? 0;

    // Promotion value.
    if (move.promotion) score += (PIECE_VALUES[move.promotion] ?? 0) - PIECE_VALUES.p;

    // Give/avoid immediate check & checkmate.
    if (move.isCheckmate) score += 10_000;
    else if (move.isCheck) score += 90;

    // Marginal board position (prefer moving toward the center).
    const toIndex = (square: string) => (square.charCodeAt(0) - 97) + (square.charCodeAt(1) - 49) * 8;
    score += (4 - Math.abs(3.5 - (toIndex(move.to) % 8))) * 2;

    // Easy-to-recognise developing moves for low difficulties.
    return score;
  }
}

/** Create a timer that forces a bot to "think" like a human. */
export function botThinkDelay(difficulty: BotDifficulty): number {
  switch (difficulty) {
    case "beginner":
      return 350;
    case "easy":
      return 500;
    case "medium":
      return 700;
    case "hard":
      return 950;
    case "expert":
      return 1200;
  }
}

/** URL-safe identifier used by the bot UI. */
export function botName(difficulty: BotDifficulty): string {
  return `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)} Bot`;
}

export type { Color, Square, PieceSymbol };