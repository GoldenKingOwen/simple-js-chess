import type { User } from "./user";

export type GameColor = "w" | "b";
export type PieceSquare = { square: string; type: string; color: "w" | "b" };

export type TimeControlId = "bullet" | "blitz" | "rapid" | "classical" | "casual";

export interface TimeControl {
  id: TimeControlId;
  label: string;
  /** Initial time in milliseconds. */
  timeMs: number;
  /** Increment in milliseconds per move. */
  incrementMs: number;
}

export type GameMode = "local" | "bot" | "online";
export type GameStatus =
  | "waiting"
  | "active"
  | "ended"
  | "aborted"
  | "scheduled"
  | "rematch";

export type GameResult =
  | { winner: GameColor; outcome: "checkmate" | "resignation" | "timeout" | "forfeit" }
  | { winner: null; outcome: "stalemate" | "repetition" | "insufficient-material" | "agreement" | "fifty-move" };

export interface GamePlayer {
  user: User;
  color: GameColor;
  rating: number | null;
  ratingDelta: number | null;
  clockMs: number;
  disconnected: boolean;
  connected: boolean;
}

export interface Game {
  id: string;
  mode: GameMode;
  status: GameStatus;
  timeControl: TimeControl;
  rated: boolean;
  white: GamePlayer;
  black: GamePlayer;
  position: string;
  moves: string[];
  moveHistory: Move[];
  result: GameResult | null;
  startedAt: string | null;
  endedAt: string | null;
  pauseRequestedBy?: string | null;
  drawOfferBy?: string | null;
  pgn: string;
  viewers: number;
  currentPlayerColor: GameColor;
  /** The viewer's own color when the backend knows it (online games). */
  myColor?: GameColor;
}

export interface Move {
  /** UCI-style notation, e.g. "e2e4". */
  uci: string;
  /** Standard Algebraic Notation, e.g. "e4". */
  san: string;
  fen: string;
  color: GameColor;
  from: string;
  to: string;
  piece: string;
  captured?: string;
  flags: string;
  promotion?: string;
  check?: boolean;
  checkmate?: boolean;
  /** Milliseconds remaining on the mover's clock after the move. */
  timeMs?: number;
  clockDeltaMs?: number;
  timestamp: string;
}

export interface GameInvitation {
  id: string;
  inviter: User;
  invitee: User | null;
  gameId: string | null;
  timeControl: TimeControl;
  rated: boolean;
  colorPreference: GameColor | "random";
  message: string | null;
  status: "pending" | "accepted" | "declined" | "expired";
  expiresAt: string;
  createdAt: string;
}

export interface GameOverInfo {
  gameId: string;
  result: GameResult;
  winnerName: string | null;
  loserName: string | null;
  moveCount: number;
  ratingChanges: { white: number | null; black: number | null };
}

export interface CreateGameInput {
  mode: GameMode;
  timeControlId: TimeControlId;
  /** Raw backend time-control string, overrides `timeControlId` (e.g. "unlimited"). */
  timeControl?: string;
  rated: boolean;
  colorPreference?: GameColor | "random";
  inviteeId?: string | null;
  botDifficulty?: BotDifficulty;
}

export type BotDifficulty = "beginner" | "easy" | "medium" | "hard" | "expert";

export type JoinGameResult =
  | { ok: true; game: Game }
  | { ok: false; error: string };