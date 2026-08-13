import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
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
  getGames(userId?: string): Promise<Game[]>;
  getGameMoves(gameId: string): Promise<Move[]>;
  startMatchmaking(input: { timeControlId: TimeControlId; rated: boolean }): Promise<MatchmakingTicket>;
  cancelMatchmaking(ticketId: string): Promise<void>;
}

/**
 * REST endpoints the future NestJS backend exposes (see docs/backend-contract.md).
 * POST /games, POST /games/:id/join, GET /games/:id,
 * POST /games/:id/moves, POST /games/:id/resign, POST /games/:id/draw,
 * PUT /games/:id/draw, GET /games, POST /matchmaking.
 */
const realGameService: GameService = {
  async createGame(input) {
    const { data } = await apiClient.post<{ data: Game }>("/games", input);
    return data;
  },
  async joinGame(gameId) {
    const { data } = await apiClient.post<{ data: Game }>(`/games/${gameId}/join`);
    return data;
  },
  async getGame(gameId) {
    const { data } = await apiClient.get<{ data: Game }>(`/games/${gameId}`);
    return data;
  },
  async makeMove(gameId, from, to, promotion) {
    const { data } = await apiClient.post<{ data: Game }>(`/games/${gameId}/moves`, {
      from,
      to,
      promotion,
    });
    return data;
  },
  async resignGame(gameId) {
    const { data } = await apiClient.post<{ data: Game }>(`/games/${gameId}/resign`);
    return data;
  },
  async offerDraw(gameId) {
    const { data } = await apiClient.post<{ data: Game }>(`/games/${gameId}/draw`);
    return data;
  },
  async respondDraw(gameId, accept) {
    const { data } = await apiClient.put<{ data: Game }>(`/games/${gameId}/draw`, { accept });
    return data;
  },
  async getGames(userId) {
    const { data } = await apiClient.get<{ data: Game[] }>("/games", { query: { userId } });
    return data;
  },
  async getGameMoves(gameId) {
    const { data } = await apiClient.get<{ data: Move[] }>(`/games/${gameId}/moves`);
    return data;
  },
  async startMatchmaking(input) {
    const { data } = await apiClient.post<{ data: MatchmakingTicket }>("/matchmaking", input);
    return data;
  },
  async cancelMatchmaking(ticketId) {
    await apiClient.delete(`/matchmaking/${ticketId}`);
  },
};

export const gameService: GameService = USE_MOCK_API ? mockGames : realGameService;