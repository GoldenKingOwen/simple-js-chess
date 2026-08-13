import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import type { LeaderboardFilter, LeaderboardPage, LeaderboardPeriod } from "@/types";
import { mockLeaderboardData } from "./mock/mock-leaderboard";

export interface LeaderboardService {
  getLeaderboard(filter: LeaderboardFilter, period: LeaderboardPeriod): Promise<LeaderboardPage>;
}

/** GET /leaderboard?filter=&period= (see docs/backend-contract.md). */
const realLeaderboardService: LeaderboardService = {
  async getLeaderboard(filter, period) {
    const { data } = await apiClient.get<{ data: LeaderboardPage }>("/leaderboard", {
      query: { filter, period },
    });
    return data;
  },
};

export const leaderboardService: LeaderboardService = USE_MOCK_API
  ? mockLeaderboardData
  : realLeaderboardService;