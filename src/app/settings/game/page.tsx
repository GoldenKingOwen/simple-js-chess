import type { Metadata } from "next";
import { GameSettingsForm } from "./game-settings-form";

export const metadata: Metadata = { title: "Settings · Game" };

export default function GameSettingsPage() {
  return <GameSettingsForm />;
}