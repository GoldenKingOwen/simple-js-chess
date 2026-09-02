import type { Metadata } from "next";
import { LearnClient } from "./learn-client";

export const metadata: Metadata = {
  title: "Learn",
  description: "A guided path from beginner to expert — concepts, tactics puzzles and bot practice.",
};

export default function LearnPage() {
  return <LearnClient />;
}
