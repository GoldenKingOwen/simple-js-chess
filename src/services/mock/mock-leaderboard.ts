import { isDev } from "@/config/env";
import type { LeaderboardEntry, LeaderboardFilter, LeaderboardPage, User } from "@/types";
import type { LeaderboardService } from "../leaderboard-service";
import { mockLeaderboard } from "./mock-data";

const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, isDev ? ms : 0));

function toEntry(user: User, index: number): LeaderboardEntry {
  return {
    rank: index + 1,
    user,
    rating: user.rating,
    games: 100 + index * 37,
    wins: 55 + index * 19,
    losses: 32 + index * 13,
    draws: 13 + index * 5,
    winRate: Math.round(((55 + index * 19) / (100 + index * 37)) * 100),
    streak: (index * 3) % 9,
  };
}

export const mockLeaderboardData: LeaderboardService = {
  async getLeaderboard(filter: LeaderboardFilter) {
    await delay();
    const users = mockLeaderboard().slice(0, filter === "friends" ? 4 : 12);
    const entries = users.map(toEntry);
    return { entries, total: entries.length } satisfies LeaderboardPage;
  },
};