"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/stores/settings-store";
import type { ThemeMode } from "@/stores/settings-store";
import { BOARD_THEME_LIST } from "@/config/board-themes";
import type { PieceStyleId } from "@/config/board-themes";
import { cn } from "@/lib/utils";

function PieceStyleButton({
  id,
  label,
  preview,
  active,
  onSelect,
}: {
  id: PieceStyleId;
  label: string;
  preview: string;
  active: boolean;
  onSelect: (id: PieceStyleId) => void;
}) {
  return (
    <button
      onClick={() => onSelect(id)}
      aria-pressed={active}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition",
        active ? "border-primary bg-primary/5" : "hover:bg-accent/40",
      )}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {preview}
      </span>
      {label}
    </button>
  );
}

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function AppearanceSettings() {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const boardTheme = useSettingsStore((state) => state.boardTheme);
  const setBoardTheme = useSettingsStore((state) => state.setBoardTheme);
  const pieceStyle = useSettingsStore((state) => state.pieceStyle);
  const setPieceStyle = useSettingsStore((state) => state.setPieceStyle);

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const update = () => setResolvedTheme(media.matches ? "light" : "dark");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose how Chess Arena looks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.id}
                role="radio"
                aria-checked={themeMode === option.id}
                onClick={() => setThemeMode(option.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition",
                  themeMode === option.id ? "border-primary bg-primary/5" : "hover:bg-accent/40",
                )}
              >
                <option.icon className={cn("h-5 w-5", themeMode === option.id ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {themeMode === "system"
              ? `Following your system preference (${resolvedTheme}).`
              : `Active theme: ${themeMode}.`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Board theme</CardTitle>
          <CardDescription>Colors of the squares on your board.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {BOARD_THEME_LIST.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setBoardTheme(theme.id)}
                aria-pressed={boardTheme === theme.id}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition",
                  boardTheme === theme.id ? "border-primary ring-1 ring-primary/40" : "hover:bg-accent/40",
                )}
              >
                <span className="flex overflow-hidden rounded-sm shadow-sm" aria-hidden="true">
                  <span className="h-6 w-6" style={{ backgroundColor: theme.light }} />
                  <span className="h-6 w-6" style={{ backgroundColor: theme.dark }} />
                </span>
                <span className="text-xs font-medium">{theme.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Piece style</CardTitle>
          <CardDescription>How the pieces are drawn.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <PieceStyleButton id="standard" label="Standard" preview="♞" active={pieceStyle === "standard"} onSelect={setPieceStyle} />
            <PieceStyleButton id="unicode" label="Unicode" preview="♞" active={pieceStyle === "unicode"} onSelect={setPieceStyle} />
          </div>
          {pieceStyle === "unicode" && (
            <Label className="mt-2 inline-block text-xs text-muted-foreground">Unicode pieces scale with the board font.</Label>
          )}
        </CardContent>
      </Card>
    </div>
  );
}