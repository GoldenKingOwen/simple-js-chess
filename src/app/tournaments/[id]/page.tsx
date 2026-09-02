import type { Metadata } from "next";
import { TournamentClient } from "./tournament-client";

export const metadata: Metadata = {
  title: "Tournament",
  description: "Bracket, pairings and results.",
  robots: { index: false },
};

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TournamentClient key={id} id={id} />;
}
