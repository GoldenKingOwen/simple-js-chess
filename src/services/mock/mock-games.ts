import { ChessEngine } from "@/lib/chess/chess-engine";
import type { Move } from "@/types/game";
import { isDev } from "@/config/env";
import { ApiError } from "@/types";
import type {
  CreateGameInput,
  Game,
  GameColor,
  GamePlayer,
  TimeControlId,
  User,
} from "@/types";
import { getTimeControl } from "@/config/time-controls";
import type { GameService } from "../game-service";
import { buildMockGame, MOCK_CURRENT_USER, MOCK_USERS } from "./mock-data";

const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, isDev ? ms : 0));

interface MockGameRecord {
  game: Game;
  engine: ChessEngine;
}

const games = new Map<string, MockGameRecord>();

function pickOpponent(excludeId: string): User {
  const pool = MOCK_USERS.filter((user) => user.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}

function toPlayer(user: User, color: GameColor, clockMs: number, rating: number | null = null): GamePlayer {
  return {
    user,
    color,
    rating: rating ?? user.rating,
    ratingDelta: null,
    clockMs,
    disconnected: false,
    connected: true,
  };
}

function toApiMove(move: import("@/lib/chess/chess-engine").EngineMove, index: number): Move {
  return {
    uci: move.lan,
    san: move.san,
    fen: move.after,
    color: move.color,
    from: move.from,
    to: move.to,
    piece: move.piece,
    captured: move.captured,
    flags: move.flags,
    promotion: move.promotion,
    check: move.isCheck || undefined,
    checkmate: move.isCheckmate || undefined,
    timestamp: new Date(Date.now() + index * 15000).toISOString(),
  };
}

type FinishedMockGame = ReturnType<typeof buildMockGame>;

function toFinishedGame(finished: FinishedMockGame): Game {
  const timeControl = getTimeControl(finished.timeControlId as TimeControlId);
  const winner: GameColor | null =
    finished.result === "white" ? "w" : finished.result === "black" ? "b" : null;
  const lastMove = finished.moves[finished.moves.length - 1];
  const engine = new ChessEngine();
  for (const move of finished.moves) {
    try {
      engine.moveFromSan(move.san);
    } catch {
      break;
    }
  }
  return {
    id: finished.id,
    mode: "online",
    status: "ended",
    timeControl,
    rated: finished.rated,
    white: toPlayer(finished.white, "w", 0, finished.white.rating),
    black: toPlayer(finished.black, "b", 0, finished.black.rating),
    position: engine.fen(),
    moves: finished.moves.map((move) => move.san),
    moveHistory: finished.moves,
    result: winner
      ? { winner, outcome: "checkmate" as const }
      : { winner: null, outcome: "stalemate" as const },
    startedAt: finished.startedAt,
    endedAt: finished.endedAt,
    drawOfferBy: null,
    pgn: finished.pgn,
    viewers: 0,
    currentPlayerColor: lastMove ? (lastMove.color === "w" ? "b" : "w") : "w",
  };
}

export const mockGames: GameService = {
  async createGame(input: CreateGameInput) {
    await delay();
    const timeControl = getTimeControl(input.timeControlId);
    const opponent = pickOpponent(MOCK_CURRENT_USER.id);
    const game: Game = {
      id: `mock-${Date.now()}`,
      mode: input.mode,
      status: "active",
      timeControl,
      rated: input.rated ?? false,
      white: toPlayer(MOCK_CURRENT_USER, "w", timeControl.timeMs),
      black: toPlayer(opponent, "b", timeControl.timeMs),
      position: new ChessEngine().fen(),
      moves: [],
      moveHistory: [],
      result: null,
      startedAt: new Date().toISOString(),
      endedAt: null,
      drawOfferBy: null,
      pgn: "",
      viewers: 0,
      currentPlayerColor: "w",
    };
    games.set(game.id, { game, engine: new ChessEngine() });
    return game;
  },

  async joinGame(gameId: string) {
    await delay();
    const record = games.get(gameId);
    if (!record) throw new ApiError("Game no longer exists.", 404);
    return record.game;
  },

  async getGame(gameId: string) {
    await delay(150);
    const record = games.get(gameId);
    if (!record) throw new ApiError("Game no longer exists.", 404);
    return record.game;
  },

  async makeMove(gameId: string, from: string, to: string, promotion?: string) {
    await delay(120);
    const record = games.get(gameId);
    if (!record) throw new ApiError("Game no longer exists.", 404);
    const { engine, game } = record;
    if (game.status !== "active") throw new ApiError("Game has already ended.", 409);

    const applied = engine.move({ from: from as never, to: to as never, promotion: promotion as never });
    const apiMove = toApiMove(applied, game.moveHistory.length);
    game.position = engine.fen();
    game.moves.push(apiMove.san);
    game.moveHistory.push(apiMove);
    game.pgn = engine.pgn();
    game.currentPlayerColor = engine.turn();

    // Award increment
    const mover = apiMove.color === "w" ? game.white : game.black;
    mover.clockMs += game.timeControl.incrementMs;

    if (engine.isCheckmate() || engine.isStalemate() || engine.isDraw()) {
      game.status = "ended";
      const winner = engine.isCheckmate() ? (apiMove.color as GameColor) : null;
      game.result = winner
        ? { winner, outcome: "checkmate" }
        : engine.isStalemate()
          ? { winner: null, outcome: "stalemate" }
          : { winner: null, outcome: engine.isInsufficientMaterial() ? "insufficient-material" : "repetition" };
      game.endedAt = new Date().toISOString();
    }

    return game;
  },

  async resignGame(gameId: string) {
    await delay(120);
    const record = games.get(gameId);
    if (!record) throw new ApiError("Game no longer exists.", 404);
    const { game } = record;
    if (game.status === "ended") throw new ApiError("Game has already ended.", 409);
    game.status = "ended";
    game.result = { winner: "b", outcome: "resignation" };
    game.endedAt = new Date().toISOString();
    return game;
  },

  async offerDraw(gameId: string) {
    await delay(120);
    const record = games.get(gameId);
    if (!record) throw new ApiError("Game no longer exists.", 404);
    record.game.drawOfferBy = MOCK_CURRENT_USER.id;
    return record.game;
  },

  async respondDraw(gameId: string, accept: boolean) {
    await delay(120);
    const record = games.get(gameId);
    if (!record) throw new ApiError("Game no longer exists.", 404);
    const { game } = record;
    game.drawOfferBy = null;
    if (accept) {
      game.status = "ended";
      game.result = { winner: null, outcome: "agreement" };
      game.endedAt = new Date().toISOString();
    }
    return game;
  },

  async getGames() {
    await delay(300);
    const raw = [
      buildMockGame("g1", MOCK_CURRENT_USER, MOCK_USERS[0], ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O"], "draw", "rapid", true, 0),
      buildMockGame("g2", MOCK_USERS[1], MOCK_CURRENT_USER, ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O"], "white", "blitz", true, 1),
      buildMockGame("g3", MOCK_CURRENT_USER, MOCK_USERS[2], ["Nf3", "d5", "g3", "Nf6", "Bg2", "c6", "O-O", "Bg4", "h3"], "black", "bullet", false, 2),
      buildMockGame("g4", MOCK_USERS[3], MOCK_CURRENT_USER, ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"], "draw", "rapid", true, 4),
      buildMockGame("g5", MOCK_CURRENT_USER, MOCK_USERS[4], ["c4", "e5", "Nc3", "Nf6", "g3", "d5", "cxd5", "Nxd5", "Bg2", "Nxc3"], "white", "blitz", true, 6),
    ];
    const recent = raw.map(toFinishedGame);
    for (const game of recent) {
      if (!games.has(game.id)) {
        const engine = new ChessEngine();
        for (const san of game.moves) {
          try {
            engine.moveFromSan(san);
          } catch {
            break;
          }
        }
        games.set(game.id, { game, engine });
      }
    }
    return recent;
  },

  async getGameMoves(gameId: string) {
    await delay(150);
    const record = games.get(gameId);
    if (!record) return [] as Move[];
    return record.game.moveHistory;
  },

  async startMatchmaking(input: { timeControlId: TimeControlId; rated: boolean }) {
    // Simulate a short queue wait, then auto-found an opponent so the full
    // matchmaking lifecycle (searching → found → countdown) can be exercised.
    await delay(1600);
    const timeControl = getTimeControl(input.timeControlId);
    const opponent = pickOpponent(MOCK_CURRENT_USER.id);
    const gameId = `mock-match-${Date.now()}`;
    const game: Game = {
      id: gameId,
      mode: "online",
      status: "active",
      timeControl,
      rated: input.rated,
      white: toPlayer(MOCK_CURRENT_USER, "w", timeControl.timeMs),
      black: toPlayer(opponent, "b", timeControl.timeMs),
      position: new ChessEngine().fen(),
      moves: [],
      moveHistory: [],
      result: null,
      startedAt: new Date().toISOString(),
      endedAt: null,
      drawOfferBy: null,
      pgn: "",
      viewers: 0,
      currentPlayerColor: "w",
    };
    games.set(gameId, { game, engine: new ChessEngine() });
    return {
      id: `ticket-${Date.now()}`,
      status: "found" as const,
      timeControlId: input.timeControlId,
      rated: input.rated,
      createdAt: new Date().toISOString(),
      matchedGameId: gameId,
      match: {
        opponent,
        gameId,
        color: "w",
        countdownMs: 5_000,
      },
    };
  },

  async cancelMatchmaking(ticketId: string) {
    await delay(100);
    void ticketId;
    return;
  },
};