"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "chess-notes:";
const MAX_CHARS = 5_000;

interface NotesPanelProps {
  /** Unique storage key, e.g. `game:${gameId}`. Notes are private per game. */
  storageKey: string;
  className?: string;
}

type SaveState = "saved" | "dirty" | "saving";

/**
 * Private game notes. Persisted only locally (localStorage) — the future
 * NestJS backend stores `myNotes` per user. The opponent's notes are never
 * part of this component's data contract (`myNotes` vs `opponentNotes` stays a
 * backend concern; the UI only ever renders the current user's notes).
 */
export function NotesPanel({ storageKey, className }: NotesPanelProps) {
  const [notes, setNotes] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem(STORAGE_PREFIX + storageKey) ?? "";
    } catch {
      return "";
    }
  });
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const timerRef = useRef<number | null>(null);
  const firstRender = useRef(true);

  // Debounced auto-save.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState("dirty");
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setSaveState("saving");
      try {
        window.localStorage.setItem(STORAGE_PREFIX + storageKey, notes);
        setSaveState("saved");
      } catch {
        setSaveState("dirty");
      }
    }, 700);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [notes, storageKey]);

  const clear = () => {
    setNotes("");
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + storageKey);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex items-center justify-between px-3 pb-1 pt-2">
        <span
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
          data-save-state={saveState}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              saveState === "saved" ? "bg-emerald-500" : saveState === "dirty" ? "bg-amber-400" : "bg-sky-500",
            )}
            aria-hidden="true"
          />
          {saveState === "saved" ? "Saved" : saveState === "dirty" ? "Unsaved changes" : "Saving…"}
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={clear}
          disabled={!notes}
          aria-label="Clear notes"
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Clear
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1 p-3">
        <Textarea
          value={notes}
          onChange={(event) => {
            if (event.target.value.length <= MAX_CHARS) setNotes(event.target.value);
          }}
          placeholder="Write private notes about the game…"
          aria-label="Private notes"
          className="min-h-0 flex-1 resize-none bg-muted/30"
          maxLength={MAX_CHARS}
        />
        <p className="text-right text-[10px] text-muted-foreground" aria-hidden="true">
          {notes.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </p>
      </div>
    </div>
  );
}