import type { Metadata } from "next";
import { CreateTournamentClient } from "./create-client";

export const metadata: Metadata = {
  title: "New tournament",
  description: "Set up a single-elimination bracket.",
};

export default function CreateTournamentPage() {
  return <CreateTournamentClient />;
}
