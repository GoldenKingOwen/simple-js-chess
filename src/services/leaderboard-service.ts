import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import { mapUser } from "@/lib/api/adapters";
import type { LeaderboardEntry, LeaderboardFilter, LeaderboardPage, LeaderboardPeriod } from "@/types";
import { mockLeaderboardData } from "./mock/mock-leaderboard";

export interface LeaderboardService {
  getLeaderboard(filter: LeaderboardFilter, period: LeaderboardPeriod): Promise<LeaderboardPage>;
}

type BackendRecord = Record<string, unknown>;

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * The backend has no /leaderboard route, so the board is derived from the
 * public user index (GET /users/search). That index omits ratings and stats,
 * so each user is enriched with GET /profiles/:username (real rating, games,
 * wins/losses/draws, win rate) before sorting. Filter/period are best-effort:
 * the backend exposes a single overall rating.
 */
const realLeaderboardService: LeaderboardService = {
  async getLeaderboard() {
    const raw = await apiClient
      .get<unknown>("/users/search", { query: { q: "", limit: 100 } })
      .catch(() => []);

    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as BackendRecord)?.users)
        ? ((raw as BackendRecord).users as unknown[])
        : [];

    const entries: LeaderboardEntry[] = (
      await Promise.all(
        list.slice(0, 50).map(async (item) => {
          const user = mapUser(item as BackendRecord);
          const profile = user.username
            ? await apiClient
                .get<BackendRecord>(`/profiles/${encodeURIComponent(user.username)}`)
                .catch(() => null)
            : null;
          const p = profile ?? {};
          const rating = num(p.rating, user.rating);
          const games = num(p.gamesPlayed);
          const wins = num(p.wins);
          const losses = num(p.losses);
          const draws = num(p.draws);
          const winRate = num(p.winRate, games > 0 ? Math.round((wins / games) * 100) : 0);
          return {
            rank: 0,
            user: { ...user, rating },
            rating,
            games,
            wins,
            losses,
            draws,
            winRate,
            streak: 0,
          } satisfies LeaderboardEntry;
        }),
      )
    )
      .sort((a, b) => b.rating - a.rating)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return { entries, total: entries.length };
  },
};

export const leaderboardService: LeaderboardService = USE_MOCK_API
  ? mockLeaderboardData
  : realLeaderboardService;
