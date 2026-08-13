import type { Metadata } from "next";
import { ReplayClient } from "./replay-client";

export const metadata: Metadata = {
  title: "Game replay",
  description: "Review a finished game move by move.",
  robots: { index: false },
};

export default async function GameReplayPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return <ReplayClient key={gameId} gameId={gameId} />;
}