"use client";

import { useQuery } from "@tanstack/react-query";
import { achievementService } from "@/services/achievement-service";

export const achievementKeys = {
  mine: ["achievements", "me"] as const,
  forUser: (username: string) => ["achievements", "user", username] as const,
};

export function useMyAchievements(enabled = true) {
  return useQuery({
    queryKey: achievementKeys.mine,
    queryFn: () => achievementService.listMine(),
    enabled,
  });
}

export function useUserAchievements(username: string) {
  return useQuery({
    queryKey: achievementKeys.forUser(username),
    queryFn: () => achievementService.listForUser(username),
    enabled: Boolean(username),
  });
}
