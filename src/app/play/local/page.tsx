import type { Metadata } from "next";
import { LocalGame } from "./local-game";

export const metadata: Metadata = {
  title: "Local game",
  description: "Play chess against a friend on the same device.",
};

export default function LocalGamePage() {
  return <LocalGame />;
}