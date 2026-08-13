import type { Metadata } from "next";
import { BotGame } from "./bot-game";

export const metadata: Metadata = {
  title: "Play the bot",
  description: "Practice against the computer at five difficulty levels.",
};

export default function BotGamePage() {
  return <BotGame />;
}