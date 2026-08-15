import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import { mapGame, mapMove, toBackendGameInput, toBackendTimeControl } from "@/lib/api/adapters";
import type {
  CreateGameInput,
  Game,
  MatchmakingTicket,
  Move,
  TimeControlId,
} from "@/types";
import { mockGames } from "./mock/mock-games";

export interface GameService {
  createGame(input: CreateGameInput): Promise<Game>;
  joinGame(gameId: string): Promise<Game>;
  getGame(gameId: string): Promise<Game>;
  makeMove(gameId: string, from: string, to: string, promotion?: string): Promise<Game>;
  resignGame(gameId: string): Promise<Game>;
  offerDraw(gameId: string): Promise<Game>;
  respondDraw(gameId: string, accept: boolean): Promise<Game>;
  /**
   * The current user's games, or — when a username is given — that user's
   * public game history (GET /users/:username/games).
   */
  getGames(username?: string): Promise<Game[]>;
  getGameMoves(gameId: string): Promise<Move[]>;
  startMatchmaking(input: { timeControlId: TimeControlId; rated: boolean }): Promise<MatchmakingTicket>;
  cancelMatchmaking(ticketId: string): Promise<void>;
}

const realGameService: GameService = {
  async createGame(input) {
    const game = await apiClient.post<Record<string, unknown>>("/games", toBackendGameInput(input));
    return mapGame(game);
  },
  async joinGame(gameId) {
    const game = await apiClient.post<Record<string, unknown>>(`/games/${gameId}/join`);
    return mapGame(game);
  },
  async getGame(gameId) {
    const game = await apiClient.get<Record<string, unknown>>(`/games/${gameId}`);
    return mapGame(game);
  },
  async makeMove(gameId, from, to, promotion) {
    const game = await apiClient.post<Record<string, unknown>>(`/games/${gameId}/move`, {
      from,
      to,
      promotion: promotion ?? undefined,
    });
    return mapGame(game);
  },
  async resignGame(gameId) {
    const game = await apiClient.post<Record<string, unknown>>(`/games/${gameId}/resign`);
    return mapGame(game);
  },
  async offerDraw(gameId) {
    const game = await apiClient.post<Record<string, unknown>>(`/games/${gameId}/draw`);
    return mapGame(game);
  },
  async respondDraw(gameId, accept) {
    const game = await apiClient.post<Record<string, unknown>>(
      `/games/${gameId}/draw/${accept ? "accept" : "reject"}`,
    );
    return mapGame(game);
  },
  async getGames(username) {
    const path = username ? `/users/${encodeURIComponent(username)}/games` : "/games";
    const raw = await apiClient.get<unknown>(path);
    return toGameArray(raw);
  },
  async getGameMoves(gameId) {
    const raw = await apiClient.get<unknown>(`/games/${gameId}/moves`);
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as Record<string, unknown>)?.moves)
        ? ((raw as Record<string, unknown>).moves as unknown[])
        : [];
    return list.map((move, index) => mapMove(move as Record<string, unknown>, index));
  },
  async startMatchmaking(input) {
    const response = await apiClient.post<{ matched: boolean; gameId?: string }>("/matchmaking/queue", {
      timeControl: toBackendTimeControl(input.timeControlId),
      rated: input.rated,
    });
    const id = `queue-${Date.now()}`;
    const createdAt = new Date().toISOString();

    if (response.matched && response.gameId) {
      let match: MatchmakingTicket["match"];
      try {
        const game = await realGameService.getGame(response.gameId);
        const color = game.myColor ?? "w";
        match = {
          opponent: color === "w" ? game.black.user : game.white.user,
          gameId: response.gameId,
          color,
          countdownMs: 5_000,
        };
      } catch {
        match = undefined;
      }
      return {
        id,
        status: "found",
        timeControlId: input.timeControlId,
        rated: input.rated,
        createdAt,
        matchedGameId: response.gameId,
        match,
      };
    }

    return {
      id,
      status: "searching",
      timeControlId: input.timeControlId,
      rated: input.rated,
      createdAt,
    };
  },
  async cancelMatchmaking() {
    await apiClient.delete("/matchmaking/queue");
  },
};

function toGameArray(raw: unknown): Game[] {
  if (Array.isArray(raw)) return raw.map((game) => mapGame(game as Record<string, unknown>));
  const record = raw as Record<string, unknown> | null | undefined;
  const list = Array.isArray(record?.data)
    ? (record.data as unknown[])
    : Array.isArray(record?.items)
      ? (record.items as unknown[])
      : Array.isArray(record?.games)
        ? (record.games as unknown[])
        : null;
  return list ? list.map((game) => mapGame(game as Record<string, unknown>)) : [];
}

export const gameService: GameService = USE_MOCK_API ? mockGames : realGameService;
