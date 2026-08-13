"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useSettingsStore } from "@/stores/settings-store";

/**
 * Bridges the persisted settings store (`themeMode`) with next-themes, so the
 * theme chooser in Settings and the provider stay in sync. Runs the no-FOUC
 * hydration script via next-themes' own mechanism.
 */
export function ThemeBridge() {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(themeMode);
  }, [themeMode, setTheme]);

  return null;
}