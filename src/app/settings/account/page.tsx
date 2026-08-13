import type { Metadata } from "next";
import { AccountSettingsForm } from "./account-settings-form";

export const metadata: Metadata = { title: "Settings · Account" };

export default function AccountSettingsPage() {
  return <AccountSettingsForm />;
}