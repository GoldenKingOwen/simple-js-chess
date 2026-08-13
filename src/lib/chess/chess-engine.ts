import { Chess } from "chess.js";
import type { Color, Move, Piece, PieceSymbol, Square } from "chess.js";

export type SquareColor = "light" | "dark";

/**
 * Thin, typed wrapper around chess.js.
 *
 * This is the ONLY place chess.js is imported from UI code. Components consume
 * the higher-level helpers in `board-utils` / `move-utils` instead of talking
 * to chess.js directly, so swapping engines later only touches this file.
 *
 * IMPORTANT: the engine here is a pure client-side model used for UI/UX
 * rendering and local/bot games. It is NOT an authority — the future NestJS
 * backend owns online game state.
 */

export interface EngineMove {
  color: Color;
  from: Square;
  to: Square;
  piece: PieceSymbol;
  captured?: PieceSymbol;
  promotion?: PieceSymbol;
  flags: string;
  lan: string;
  san: string;
  before: string;
  after: string;
  isCheck: boolean;
  isCheckmate: boolean;
}

export interface EngineResult {
  winner: Color | null;
  reason:
    | "checkmate"
    | "stalemate"
    | "repetition"
    | "insufficient-material"
    | "fifty-move"
    | "resignation"
    | "timeout"
    | "agreement"
    | null;
}

export class ChessEngine {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = fen ? new Chess(fen) : new Chess();
  }

  /** Position encoded as a FEN string. */
  fen(): string {
    return this.chess.fen();
  }

  /** Full PGN including headers ("" for the starting position). */
  pgn(): string {
    return this.chess.pgn();
  }

  /** PGN body without headers. */
  pgnBody(): string {
    return this.chess.pgn({ maxWidth: 0 });
  }

  /** Side to move. */
  turn(): Color {
    return this.chess.turn();
  }

  reset(): void {
    this.chess.reset();
  }

  load(fen: string): { ok: boolean; error?: string } {
    try {
      this.chess.load(fen);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid FEN",
      };
    }
  }

  /** Piece on a square (undefined when empty). */
  get(square: Square): Piece | undefined {
    return this.chess.get(square);
  }

  /** All pieces currently on the board grouped by square. */
  pieces(): Record<string, Piece> {
    const result: Record<string, Piece> = {};
    for (const rank of this.chess.board()) {
      for (const square of rank) {
        if (square) result[square.square] = square;
      }
    }
    return result;
  }

  /** 8×8 grid of pieces as returned by chess.js (row 0 = rank 8). */
  board(): ({ square: Square; type: PieceSymbol; color: Color } | null)[][] {
    return this.chess.board();
  }

  /** Legal moves for the side to move (SAN strings). */
  moves(): string[] {
    return this.chess.moves();
  }

  /** Verbose legal moves, optionally filtered by square. */
  movesBySquare(square?: Square): EngineMove[] {
    const options: { verbose: true; square?: Square } = { verbose: true };
    if (square) options.square = square;
    return (this.chess.moves(options) as Move[]).map(toEngineMove);
  }

  /** Make a move; returns the resulting move or throws on an illegal move. */
  move(input: { from: Square; to: Square; promotion?: PieceSymbol }): EngineMove {
    const applied = this.chess.move(input);
    const base = toEngineMove(applied);
    return {
      ...base,
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
    };
  }

  /** Make a move expressed as SAN (e.g. "e4", "Nf3", "O-O"). */
  moveFromSan(san: string): EngineMove | null {
    if (!this.chess.moves().includes(san)) return null;
    const applied = this.chess.move(san);
    const base = toEngineMove(applied);
    return {
      ...base,
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
    };
  }

  undo(): EngineMove | null {
    const undone = this.chess.undo();
    return undone ? toEngineMove(undone) : null;
  }

  /** Full verbose history of the game so far, with check/checkmate info. */
  history(): EngineMove[] {
    const moves = this.chess.history({ verbose: true });
    const replay = new Chess();
    return moves.map((m) => {
      const applied = replay.move({ from: m.from, to: m.to, promotion: m.promotion });
      const base = toEngineMove(applied);
      return {
        ...base,
        isCheck: replay.isCheck(),
        isCheckmate: replay.isCheckmate(),
      };
    });
  }

  /** True if the king of the side to move is in check. */
  isCheck(): boolean {
    return this.chess.isCheck();
  }

  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  isInsufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial();
  }

  isDraw(): boolean {
    return this.chess.isDraw();
  }

  isDrawByFiftyMoves(): boolean {
    return this.chess.isDrawByFiftyMoves();
  }

  isThreefoldRepetition(): boolean {
    return this.chess.isThreefoldRepetition();
  }

  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  /** Human-readable outcome derived from the current position. */
  result(): EngineResult {
    if (this.isCheckmate()) {
      const winner: Color = this.chess.turn() === "w" ? "b" : "w";
      return { winner, reason: "checkmate" };
    }
    if (this.isStalemate()) return { winner: null, reason: "stalemate" };
    if (this.isInsufficientMaterial()) return { winner: null, reason: "insufficient-material" };
    if (this.isThreefoldRepetition()) return { winner: null, reason: "repetition" };
    if (this.isDrawByFiftyMoves()) return { winner: null, reason: "fifty-move" };
    return { winner: null, reason: null };
  }

  /** The square of the king currently in check, when applicable. */
  kingSquareInCheck(): Square | null {
    if (!this.isCheck()) return null;
    const king = this.chess
      .board()
      .flat()
      .find((square) => square && square.type === "k" && square.color === this.chess.turn());
    return king ? king.square : null;
  }

  squareColor(square: Square): SquareColor | null {
    return this.chess.squareColor(square);
  }
}

function toEngineMove(move: Move): EngineMove {
  return {
    color: move.color,
    from: move.from,
    to: move.to,
    piece: move.piece,
    captured: move.captured,
    promotion: move.promotion,
    flags: move.flags,
    lan: move.lan,
    san: move.san,
    before: move.before,
    after: move.after,
    isCheck: false,
    isCheckmate: false,
  };
}

/** Re-export chess.js primitives so UI code never imports chess.js directly. */
export type { Color, Move, Piece, PieceSymbol, Square };
export type ChessPiece = Piece;