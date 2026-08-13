import type { Metadata } from "next";
import { LeaderboardClient } from "./leaderboard-client";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "The strongest players on Chess Arena, ranked by rating.",
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}