import type { Metadata } from "next";
import { OnlineGameClient } from "./online-game-client";

export const metadata: Metadata = {
  title: "Game",
  description: "Live online chess game.",
  robots: { index: false },
};

export default async function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return <OnlineGameClient key={gameId} gameId={gameId} />;
}