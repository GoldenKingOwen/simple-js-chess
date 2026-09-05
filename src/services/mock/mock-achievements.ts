import type { Achievement } from "@/types";
import type { AchievementService } from "../achievement-service";

const CATALOG: Omit<Achievement, "earned" | "earnedAt">[] = [
  { id: "rating-1400", name: "Climbing", description: "Reach a rating of 1400", icon: "TrendingUp" },
  { id: "rating-1600", name: "Contender", description: "Reach a rating of 1600", icon: "TrendingUp" },
  { id: "rating-1800", name: "Expert Territory", description: "Reach a rating of 1800", icon: "TrendingUp" },
  { id: "streak-3", name: "On a Roll", description: "Win 3 games in a row", icon: "Flame" },
  { id: "streak-5", name: "Hot Streak", description: "Win 5 games in a row", icon: "Flame" },
  { id: "streak-10", name: "Unstoppable", description: "Win 10 games in a row", icon: "Flame" },
  { id: "games-10", name: "Getting Started", description: "Play 10 rated games", icon: "Swords" },
  { id: "games-50", name: "Regular", description: "Play 50 rated games", icon: "Swords" },
  { id: "games-100", name: "Veteran", description: "Play 100 rated games", icon: "Swords" },
  { id: "beat-medium-bot", name: "Bot Beater", description: "Beat the medium bot", icon: "Bot" },
  { id: "beat-hard-bot", name: "Silicon Crusher", description: "Beat the hard bot", icon: "Bot" },
  { id: "beat-expert-bot", name: "Machine Slayer", description: "Beat the expert bot", icon: "Bot" },
  { id: "tournament-winner", name: "Champion", description: "Win a tournament", icon: "Trophy" },
  { id: "learn-beginner", name: "First Lessons", description: "Complete every Beginner lesson", icon: "GraduationCap" },
  { id: "learn-intermediate", name: "Student of the Game", description: "Complete every Intermediate lesson", icon: "GraduationCap" },
];

const EARNED = new Set(["rating-1400", "streak-3", "games-10", "beat-medium-bot", "learn-beginner"]);

function withState(ids: Set<string>): Achievement[] {
  return CATALOG.map((a) => ({
    ...a,
    earned: ids.has(a.id),
    earnedAt: ids.has(a.id) ? new Date(Date.now() - 86_400_000 * 3).toISOString() : null,
  }));
}

export const mockAchievements: AchievementService = {
  async listMine() {
    return withState(EARNED);
  },
  async listForUser() {
    return withState(new Set(["rating-1400", "rating-1600", "streak-5", "games-50", "tournament-winner"]));
  },
};
