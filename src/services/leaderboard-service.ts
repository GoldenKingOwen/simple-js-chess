import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import { mapUser } from "@/lib/api/adapters";
import type { LeaderboardEntry, LeaderboardFilter, LeaderboardPage, LeaderboardPeriod } from "@/types";
import { mockLeaderboardData } from "./mock/mock-leaderboard";

export interface LeaderboardService {
  getLeaderboard(filter: LeaderboardFilter, period: LeaderboardPeriod): Promise<LeaderboardPage>;
}

/**
 * The backend has no /leaderboard route, so the board is derived from the
 * public user index (GET /users/search). Filter/period are best-effort: the
 * backend exposes a single overall rating, which we sort descending.
 */
const realLeaderboardService: LeaderboardService = {
  async getLeaderboard() {
    const raw = await apiClient
      .get<unknown>("/users/search", { query: { q: "", limit: 100 } })
      .catch(() => []);

    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as Record<string, unknown>)?.users)
        ? ((raw as Record<string, unknown>).users as unknown[])
        : [];

    const entries: LeaderboardEntry[] = list
      .map((item, index) => {
        const user = mapUser(item as Record<string, unknown>);
        return {
          rank: index + 1,
          user,
          rating: user.rating,
          games: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          streak: 0,
        } satisfies LeaderboardEntry;
      })
      .sort((a, b) => b.rating - a.rating)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return { entries, total: entries.length };
  },
};

export const leaderboardService: LeaderboardService = USE_MOCK_API
  ? mockLeaderboardData
  : realLeaderboardService;
