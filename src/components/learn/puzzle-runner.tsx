"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Check, CircleX, RotateCcw } from "lucide-react";
import { ChessBoard } from "@/components/chess/chess-board";
import type { ResolvedMove } from "@/components/chess/chess-board";
import { ChessEngine } from "@/lib/chess/chess-engine";
import type { Square } from "@/lib/chess/chess-engine";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/stores/settings-store";
import { learningService } from "@/services/learning-service";
import type { LessonPuzzle } from "@/types";
import { cn } from "@/lib/utils";

type Feedback = "idle" | "wrong" | "right" | "solved";

interface PuzzleRunnerProps {
  slug: string;
  puzzles: LessonPuzzle[];
  required: number;
  onProgress: (solvedIds: string[]) => void;
  onComplete: () => void;
}

const uciOf = (m: ResolvedMove) => `${m.from}${m.to}${m.promotion ?? ""}`;
const fromUci = (uci: string) => ({
  from: uci.slice(0, 2) as Square,
  to: uci.slice(2, 4) as Square,
  promotion: uci[4] as ResolvedMove["promotion"],
});

/**
 * Drives a lesson's puzzle set on top of the shared <ChessBoard> (not a fork):
 * the outer component owns set progress; a keyed <SinglePuzzle> owns one puzzle's
 * board state and submits each move to the backend for validation.
 */
export function PuzzleRunner({ slug, puzzles, required, onProgress, onComplete }: PuzzleRunnerProps) {
  const [solvedIds, setSolvedIds] = useState<string[]>(
    () => puzzles.filter((p) => p.solved).map((p) => p.id),
  );
  const [index, setIndex] = useState(() => {
    const firstUnsolved = puzzles.findIndex((p) => !p.solved);
    return firstUnsolved === -1 ? 0 : firstUnsolved;
  });

  const puzzle = puzzles[index];
  const allSolved = puzzles.every((p) => solvedIds.includes(p.id));

  const handleSolved = useCallback(
    (serverSolvedIds: string[] | undefined) => {
      const next = serverSolvedIds ?? Array.from(new Set([...solvedIds, puzzle.id]));
      setSolvedIds(next);
      onProgress(next);
      const solvedInSet = puzzles.filter((p) => next.includes(p.id)).length;
      if (solvedInSet >= required) {
        window.setTimeout(() => onComplete(), 500);
      } else {
        window.setTimeout(
          () => setIndex((i) => {
            const rest = puzzles.findIndex((p, idx) => idx > i && !next.includes(p.id));
            return rest === -1 ? Math.min(i + 1, puzzles.length - 1) : rest;
          }),
          800,
        );
      }
    },
    [solvedIds, puzzle?.id, onProgress, puzzles, required, onComplete],
  );

  const solvedCount = solvedIds.length;

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">
          Puzzle {index + 1} of {puzzles.length}
        </span>
        <span className="tabular-nums text-muted-foreground">
          {Math.min(solvedCount, required)}/{required} solved
        </span>
      </div>

      <SinglePuzzle
        key={puzzle.id}
        slug={slug}
        puzzle={puzzle}
        onSolved={handleSolved}
      />

      {allSolved && (
        <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-center text-sm font-medium text-emerald-600">
          Set complete — every puzzle solved.
        </p>
      )}
    </div>
  );
}

function SinglePuzzle({
  slug,
  puzzle,
  onSolved,
}: {
  slug: string;
  puzzle: LessonPuzzle;
  onSolved: (serverSolvedIds: string[] | undefined) => void;
}) {
  const boardTheme = useSettingsStore((s) => s.boardTheme);
  const pieceStyle = useSettingsStore((s) => s.pieceStyle);

  const engineRef = useRef<ChessEngine>(new ChessEngine(puzzle.fen));
  const [fen, setFen] = useState(puzzle.fen);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [solverMoves, setSolverMoves] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(puzzle.solved ? "solved" : "idle");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    engineRef.current = new ChessEngine(puzzle.fen);
    setFen(puzzle.fen);
    setLastMove(null);
    setSolverMoves([]);
    setFeedback("idle");
  }, [puzzle.fen]);

  const applyUci = useCallback((uci: string) => {
    const m = fromUci(uci);
    engineRef.current.move(m);
    setFen(engineRef.current.fen());
    setLastMove({ from: m.from, to: m.to });
  }, []);

  const onMove = useCallback(
    (move: ResolvedMove) => {
      if (busy || feedback === "solved") return;
      const uci = uciOf(move);
      const attempt = [...solverMoves, uci];
      setBusy(true);
      try {
        applyUci(uci);
      } catch {
        setBusy(false);
        return;
      }

      learningService
        .submitAttempt(slug, puzzle.id, attempt)
        .then((res) => {
          if (!res.correct) {
            setFeedback("wrong");
            window.setTimeout(() => reload(), 700);
            return;
          }
          setSolverMoves(attempt);
          if (res.solved) {
            setFeedback("solved");
            onSolved(res.solvedPuzzleIds);
            return;
          }
          setFeedback("right");
          if (res.reply) {
            const reply = res.reply;
            window.setTimeout(() => {
              try {
                applyUci(reply);
              } catch {
                /* recorded reply somehow illegal — leave the board */
              }
              setFeedback("idle");
            }, 350);
          } else {
            setFeedback("idle");
          }
        })
        .catch(() => {
          setFeedback("wrong");
          window.setTimeout(() => reload(), 700);
        })
        .finally(() => setBusy(false));
    },
    [busy, feedback, solverMoves, applyUci, slug, puzzle.id, reload, onSolved],
  );

  const interaction =
    feedback === "solved" || busy
      ? "spectator"
      : puzzle.sideToMove === "w"
        ? "white-only"
        : "black-only";

  const message = useMemo(() => {
    switch (feedback) {
      case "wrong": return { text: "Not the move — try again.", tone: "wrong" as const };
      case "right": return { text: "Correct — keep going.", tone: "right" as const };
      case "solved": return { text: "Solved!", tone: "right" as const };
      default:
        return {
          text: `${puzzle.sideToMove === "w" ? "White" : "Black"} to move.`,
          tone: "idle" as const,
        };
    }
  }, [feedback, puzzle.sideToMove]);

  return (
    <>
      <ChessBoard
        fen={fen}
        interaction={interaction}
        boardThemeId={boardTheme}
        pieceStyle={pieceStyle}
        lastMove={lastMove}
        onMove={onMove}
      />

      <div
        className={cn(
          "mt-3 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium",
          message.tone === "wrong" && "bg-destructive/10 text-destructive",
          message.tone === "right" && "bg-emerald-500/10 text-emerald-600",
          message.tone === "idle" && "bg-muted/50 text-muted-foreground",
        )}
        role="status"
        aria-live="polite"
      >
        <span className="flex items-center gap-1.5">
          {message.tone === "wrong" && <CircleX className="h-4 w-4" aria-hidden="true" />}
          {message.tone === "right" && <Check className="h-4 w-4" aria-hidden="true" />}
          {message.text}
        </span>
        {feedback !== "solved" && solverMoves.length + (feedback === "wrong" ? 1 : 0) > 0 && (
          <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={reload} disabled={busy}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset
          </Button>
        )}
      </div>
    </>
  );
}
