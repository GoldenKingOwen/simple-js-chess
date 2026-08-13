import type { Metadata } from "next";
import { PrivacySettingsForm } from "./privacy-settings-form";

export const metadata: Metadata = { title: "Settings · Privacy" };

export default function PrivacySettingsPage() {
  return <PrivacySettingsForm />;
}