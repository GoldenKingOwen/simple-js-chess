import type { Metadata } from "next";
import { SettingsNav } from "./settings-nav";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account, appearance, game and privacy preferences.",
  robots: { index: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">Customize Chess Arena to your taste.</p>
      </div>
      <div className="flex flex-col gap-8 md:flex-row">
        <SettingsNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}