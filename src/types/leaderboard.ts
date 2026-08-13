import type { User } from "./user";

export interface LeaderboardEntry {
  rank: number;
  user: User;
  rating: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  streak: number;
}

export type LeaderboardFilter = "global" | "friends" | "blitz" | "rapid" | "bullet";
export type LeaderboardPeriod = "all" | "day" | "week" | "month";

export interface LeaderboardPage {
  entries: LeaderboardEntry[];
  total: number;
}