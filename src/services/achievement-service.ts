import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import type { Achievement } from "@/types";
import { mockAchievements } from "./mock/mock-achievements";

export interface AchievementService {
  /** The full catalog with the current user's earned state. */
  listMine(): Promise<Achievement[]>;
  /** The catalog with a public user's earned badges. */
  listForUser(username: string): Promise<Achievement[]>;
}

const realAchievementService: AchievementService = {
  listMine() {
    return apiClient.get<Achievement[]>("/achievements/me");
  },
  listForUser(username) {
    return apiClient.get<Achievement[]>(`/achievements/users/${encodeURIComponent(username)}`);
  },
};

export const achievementService: AchievementService = USE_MOCK_API
  ? mockAchievements
  : realAchievementService;
