import type { Metadata } from "next";
import { AppearanceSettings } from "./appearance-settings";

export const metadata: Metadata = { title: "Settings · Appearance" };

export default function AppearancePage() {
  return <AppearanceSettings />;
}