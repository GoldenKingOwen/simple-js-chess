import type { Metadata } from "next";
import { GamesClient } from "./games-client";

export const metadata: Metadata = {
  title: "Games",
  description: "Browse your recent games and results.",
};

export default function GamesPage() {
  return <GamesClient />;
}