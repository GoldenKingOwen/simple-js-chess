"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/stores/settings-store";
import type { GameSettings, SoundSettings } from "@/stores/settings-store";
import { cn } from "@/lib/utils";

function sliderValue(value: number | readonly number[]): number {
  return typeof value === "number" ? value : (value[0] ?? 0);
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3" data-testid={`setting-${id}`}>
      <div>
        <Label htmlFor={id} className="font-medium">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

const SOUND_FIELDS: { key: keyof SoundSettings; label: string }[] = [
  { key: "move", label: "Move" },
  { key: "capture", label: "Capture" },
  { key: "check", label: "Check" },
  { key: "gameEnd", label: "Game end" },
  { key: "notification", label: "Notification" },
];

export function GameSettingsForm() {
  const game = useSettingsStore((state) => state.game);
  const updateGame = useSettingsStore((state) => state.updateGame);
  const updateSound = useSettingsStore((state) => state.updateSound);

  const toggle = (patch: Partial<GameSettings>) => updateGame(patch);

  const soundIcon =
    game.soundEnabled && game.sound.master > 0.5 ? Volume2 : game.soundEnabled ? Volume1 : VolumeX;
  const SoundIcon = soundIcon;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gameplay</CardTitle>
          <CardDescription>Board behaviour while you play.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <ToggleRow
            id="showLegalMoves"
            label="Show legal moves"
            description="Display a dot on every square a selected piece can move to."
            checked={game.showLegalMoves}
            onCheckedChange={(checked) => toggle({ showLegalMoves: checked })}
          />
          <ToggleRow
            id="highlightLastMove"
            label="Highlight last move"
            description="Tint the squares of the most recent move."
            checked={game.highlightLastMove}
            onCheckedChange={(checked) => toggle({ highlightLastMove: checked })}
          />
          <ToggleRow
            id="showCoordinates"
            label="Show coordinates"
            description="Display rank and file labels around the board."
            checked={game.showCoordinates}
            onCheckedChange={(checked) => toggle({ showCoordinates: checked })}
          />
          <ToggleRow
            id="confirmMoves"
            label="Confirm moves"
            description="Ask for confirmation before playing an important move."
            checked={game.confirmMoves}
            onCheckedChange={(checked) => toggle({ confirmMoves: checked })}
          />
          <ToggleRow
            id="autoQueen"
            label="Auto-queen"
            description="Promote to a queen automatically without the picker."
            checked={game.autoQueen}
            onCheckedChange={(checked) => toggle({ autoQueen: checked })}
          />
          <ToggleRow
            id="animations"
            label="Piece animations"
            description="Smoothly animate pieces as they move."
            checked={game.animations}
            onCheckedChange={(checked) => toggle({ animations: checked })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SoundIcon className={cn("h-4 w-4", !game.soundEnabled && "text-muted-foreground")} aria-hidden="true" /> Sound
          </CardTitle>
          <CardDescription>Control game and notification sounds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ToggleRow
            id="soundEnabled"
            label="Enabled"
            description="Play sound effects during games."
            checked={game.soundEnabled}
            onCheckedChange={(checked) => toggle({ soundEnabled: checked })}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Master volume</Label>
              <span className="text-sm tabular-nums text-muted-foreground">{Math.round(game.sound.master * 100)}%</span>
            </div>
            <Slider
              value={[game.sound.master]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={(value) => updateSound({ master: sliderValue(value) })}
              disabled={!game.soundEnabled}
              aria-label="Master volume"
            />
          </div>

          {SOUND_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{field.label}</Label>
                <span className="text-sm tabular-nums text-muted-foreground">{Math.round(game.sound[field.key] * 100)}%</span>
              </div>
              <Slider
                value={[game.sound[field.key]]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(value) => updateSound({ [field.key]: sliderValue(value) } as Partial<SoundSettings>)}
                disabled={!game.soundEnabled}
                aria-label={`${field.label} volume`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accessibility</CardTitle>
          <CardDescription>Make playing easier for everyone.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <ToggleRow
            id="voiceEnabled"
            label="Voice move read-out"
            description="Speak each move aloud as it is played."
            checked={game.voiceEnabled}
            onCheckedChange={(checked) => toggle({ voiceEnabled: checked })}
          />
        </CardContent>
      </Card>
    </div>
  );
}