import type { Metadata } from "next";
import { TournamentsClient } from "./tournaments-client";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "Join a single-elimination bracket and play your way to the top.",
};

export default function TournamentsPage() {
  return <TournamentsClient />;
}
