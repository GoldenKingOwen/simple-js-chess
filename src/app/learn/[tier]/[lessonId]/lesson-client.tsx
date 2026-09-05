"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { OnlineGameClient } from "@/app/game/[gameId]/online-game-client";
import { ChessBoard } from "@/components/chess/chess-board";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonBanner } from "@/components/learn/lesson-banner";
import { PuzzleRunner } from "@/components/learn/puzzle-runner";
import { learningService } from "@/services/learning-service";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { Lesson } from "@/types";

export function LessonClient({ tier, slug }: { tier: string; slug: string }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ["learning", "lesson", slug],
    queryFn: () => learningService.getLesson(slug),
    enabled: Boolean(user),
    retry: (count, err) =>
      // A locked tier (403) is not worth retrying.
      count < 1 && !String(err).includes("unlock"),
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["learning"] });
  }, [queryClient]);

  if (!user) {
    return (
      <Centered>
        <h1 className="text-xl font-semibold">Log in to continue</h1>
        <Link href={`/login?redirect=/learn/${tier}/${slug}`} className="text-sm text-primary hover:underline">
          Log in or create an account
        </Link>
      </Centered>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-4 h-24 w-full" />
        <Skeleton className="mx-auto aspect-square w-full max-w-[560px]" />
      </div>
    );
  }

  if (error || !lesson) {
    const locked = String(error).includes("unlock") || String(error).includes("TIER_LOCKED");
    return (
      <Centered>
        <h1 className="text-xl font-semibold">{locked ? "Tier locked" : "Lesson unavailable"}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {locked
            ? "Finish every lesson in the previous tier to unlock this one."
            : "This lesson could not be loaded."}
        </p>
        <Button variant="outline" render={<Link href="/learn" />}>
          Back to the learning path
        </Button>
      </Centered>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      {lesson.type === "CONCEPT" && <ConceptView lesson={lesson} onDone={invalidate} slug={slug} />}
      {lesson.type === "PUZZLE_SET" && <PuzzleView lesson={lesson} onChange={invalidate} />}
      {lesson.type === "BOT_PRACTICE" && <BotPracticeView lesson={lesson} onChange={invalidate} />}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      {children}
    </div>
  );
}

function ConceptView({
  lesson,
  onDone,
  slug,
}: {
  lesson: Lesson;
  onDone: () => void;
  slug: string;
}) {
  const router = useRouter();
  const boardTheme = useSettingsStore((s) => s.boardTheme);
  const pieceStyle = useSettingsStore((s) => s.pieceStyle);

  const complete = useMutation({
    mutationFn: () => learningService.completeLesson(slug),
    onSuccess: () => {
      onDone();
      router.push("/learn");
    },
  });

  return (
    <>
      <LessonBanner tier={lesson.tier} title={lesson.title} />
      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div>
          <p className="text-sm leading-relaxed text-muted-foreground">{lesson.concept?.text}</p>
          {lesson.concept?.source && (
            <p className="mt-3 text-xs italic text-muted-foreground">— {lesson.concept.source}</p>
          )}
        </div>
        <div className="mx-auto w-full max-w-[320px]">
          <ChessBoard
            fen={lesson.concept?.fen ?? "8/8/8/8/8/8/8/8 w - - 0 1"}
            interaction="spectator"
            boardThemeId={boardTheme}
            pieceStyle={pieceStyle}
            showLegalMoves={false}
          />
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => complete.mutate()} disabled={complete.isPending}>
          {complete.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {lesson.status === "COMPLETED" ? "Done" : "Mark complete"}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
        {lesson.status === "COMPLETED" && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Completed
          </span>
        )}
      </div>
    </>
  );
}

function PuzzleView({ lesson, onChange }: { lesson: Lesson; onChange: () => void }) {
  const [done, setDone] = useState(lesson.status === "COMPLETED");

  return (
    <>
      <LessonBanner
        tier={lesson.tier}
        title={lesson.title}
        objective={`Solve ${lesson.puzzleSet?.required ?? 0} puzzles to complete this lesson.`}
      />
      {lesson.puzzleSet && (
        <PuzzleRunner
          slug={lesson.slug}
          puzzles={lesson.puzzleSet.puzzles}
          required={lesson.puzzleSet.required}
          onProgress={onChange}
          onComplete={() => {
            setDone(true);
            onChange();
          }}
        />
      )}
      {done && (
        <div className="mx-auto mt-4 flex max-w-[560px] items-center justify-between gap-3 rounded-lg bg-emerald-500/10 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Lesson complete
          </span>
          <Button size="sm" variant="outline" render={<Link href="/learn" />}>
            Back to path
          </Button>
        </div>
      )}
    </>
  );
}

function BotPracticeView({ lesson, onChange }: { lesson: Lesson; onChange: () => void }) {
  const gameId = lesson.botPractice?.gameId ?? null;

  const start = useMutation({
    mutationFn: () => learningService.startPractice(lesson.slug),
    onSuccess: onChange,
  });

  const check = useMutation({
    mutationFn: () => learningService.completeLesson(lesson.slug),
    onSuccess: onChange,
  });

  return (
    <>
      <LessonBanner tier={lesson.tier} title={lesson.title} objective={lesson.botPractice?.objective} />

      {!gameId ? (
        <div className="mx-auto max-w-md rounded-xl border bg-card/60 p-6 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            You&apos;ll play a full game against the {lesson.botPractice?.difficulty} bot. When it&apos;s
            over, come back here and check the objective.
          </p>
          <Button onClick={() => start.mutate()} disabled={start.isPending}>
            {start.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Start practice game
          </Button>
        </div>
      ) : (
        <>
          {/* Reuse the full online game screen as-is. */}
          <OnlineGameClient key={gameId} gameId={gameId} />

          <div className="mx-auto mt-4 flex max-w-3xl flex-col items-center gap-2">
            <Button onClick={() => check.mutate()} disabled={check.isPending}>
              {check.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Check objective
            </Button>
            {check.data && (
              <p
                className={
                  check.data.met
                    ? "text-sm font-medium text-emerald-600"
                    : "text-sm font-medium text-muted-foreground"
                }
              >
                {check.data.met ? "Objective met — lesson complete!" : check.data.reason ?? "Not yet."}
              </p>
            )}
            {lesson.status === "COMPLETED" && !check.data && (
              <p className="inline-flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Completed
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}
