import { ChessEngine } from "@/lib/chess/chess-engine";
import type { User } from "@/types";
import type { Move } from "@/types/game";

/**
 * Deterministic mock data used ONLY by the mock development layer. Never
 * shipped as part of the production API path.
 */

export function mockUser(
  id: string,
  username: string,
  rating: number,
  status: User["status"] = "offline",
  title: string | null = null,
): User {
  return {
    id,
    username,
    email: `${username.toLowerCase()}@example.com`,
    avatarUrl: null,
    rating,
    title,
    status,
    createdAt: new Date(Date.now() - 86400000 * 240).toISOString(),
    lastSeenAt: status === "offline" ? new Date(Date.now() - 3600000 * 3).toISOString() : new Date().toISOString(),
  };
}

export const MOCK_USERS: User[] = [
  mockUser("u1", "AdaChess", 1842, "online", "FM"),
  mockUser("u2", "RookTaker", 1620, "online"),
  mockUser("u3", "KnightShift", 1478, "in-game"),
  mockUser("u4", "QueenBee", 2011, "online", "IM"),
  mockUser("u5", "PawnStorm", 1389, "offline"),
  mockUser("u6", "BishopMover", 1523, "in-game"),
  mockUser("u7", "EnPassantEnthusiast", 1710, "online"),
  mockUser("u8", "EndgameElite", 1955, "offline", "FM"),
  mockUser("u9", "ZugzwangZero", 1214, "offline"),
  mockUser("u10", "CastleCrasher", 1667, "online"),
  mockUser("u11", "TempoTaker", 1402, "offline"),
  mockUser("u12", "FianchettoPhil", 1790, "online"),
];

export const MOCK_CURRENT_USER: User = mockUser("me", "Onewen111", 1247, "online");

/** A finished game rendered with a realistic opening sequence. */
export function buildMockGame(
  id: string,
  white: User,
  black: User,
  moves: string[],
  result: "white" | "black" | "draw",
  timeControlId: string,
  rated: boolean,
  dateOffsetDays: number,
): { id: string; white: User; black: User; moves: Move[]; pgn: string; result: "white" | "black" | "draw"; timeControlId: string; rated: boolean; startedAt: string; endedAt: string; durationMs: number } {
  const engine = new ChessEngine();
  const history: Move[] = [];
  for (const san of moves) {
    if (!engine.moves().includes(san)) break;
    const applied = engine.moveFromSan(san);
    if (!applied) break;
    history.push(toApiMove(applied, history.length));
  }

  const startedAt = new Date(Date.now() - dateOffsetDays * 86400000 - 3_600_000).toISOString();
  const endedAt = new Date(Date.now() - dateOffsetDays * 86400000).toISOString();

  return {
    id,
    white,
    black,
    moves: history,
    pgn: engine.pgn(),
    result,
    timeControlId,
    rated,
    startedAt,
    endedAt,
    durationMs: 3_600_000 + history.length * 15_000,
  };
}

function toApiMove(move: import("@/lib/chess/chess-engine").EngineMove, index: number): Move {
  return {
    uci: move.san,
    san: move.san,
    fen: move.after,
    color: move.color,
    from: move.from,
    to: move.to,
    piece: move.piece,
    flags: move.flags,
    check: move.isCheck || undefined,
    checkmate: move.isCheckmate || undefined,
    timestamp: new Date(Date.now() + index * 15000).toISOString(),
  };
}

export function mockLeaderboard(): (typeof MOCK_USERS)[number][] {
  return [...MOCK_USERS].sort((a, b) => b.rating - a.rating);
}

export function mockChat(gameId: string) {
  return [
    {
      id: `${gameId}-c1`,
      gameId,
      senderUsername: "AdaChess",
      senderAvatarUrl: null,
      body: "Good luck and have fun!",
      timestamp: new Date(Date.now() - 120_000).toISOString(),
      kind: "chat" as const,
      senderId: "u1",
    },
    {
      id: `${gameId}-s1`,
      gameId,
      senderUsername: "system",
      senderAvatarUrl: null,
      body: "Game started — White to move.",
      timestamp: new Date(Date.now() - 90_000).toISOString(),
      kind: "system" as const,
      senderId: "__system__",
    },
  ];
}