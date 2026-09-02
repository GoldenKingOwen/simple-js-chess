"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Bot, Check, Lock, Puzzle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { learningService } from "@/services/learning-service";
import { useAuthStore } from "@/stores/auth-store";
import { TIER_LABELS } from "@/types";
import type { LearningPathLesson, LearningPathTier, LessonType } from "@/types";
import { cn } from "@/lib/utils";

const LESSON_ICON: Record<LessonType, typeof BookOpen> = {
  CONCEPT: BookOpen,
  PUZZLE_SET: Puzzle,
  BOT_PRACTICE: Bot,
};

export function LearnClient() {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, error } = useQuery({
    queryKey: ["learning", "path"],
    queryFn: () => learningService.getPath(),
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <BookOpen className="h-10 w-10 text-primary" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Log in to start learning</h1>
        <p className="text-sm text-muted-foreground">
          The guided path tracks your progress across tiers, so it needs an account.
        </p>
        <Link href="/login?redirect=/learn" className="text-sm font-medium text-primary hover:underline">
          Log in or create an account
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Learn</h1>
        <p className="mt-1 text-muted-foreground">
          A guided path from beginner to expert. Finish every lesson in a tier to unlock the next.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive" role="alert">
          Could not load the learning path. Try again in a moment.
        </p>
      )}

      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
          : data?.tiers.map((tier) => <TierCard key={tier.tier} tier={tier} />)}
      </div>
    </div>
  );
}

function TierCard({ tier }: { tier: LearningPathTier }) {
  const done = tier.lessons.filter((l) => l.status === "COMPLETED").length;
  const pct = tier.lessons.length ? Math.round((done / tier.lessons.length) * 100) : 0;

  return (
    <Card className={cn(!tier.unlocked && "opacity-70")}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {!tier.unlocked && <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
            {tier.completed && <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />}
            {TIER_LABELS[tier.tier]}
          </CardTitle>
          <span className="text-xs tabular-nums text-muted-foreground">
            {done}/{tier.lessons.length}
          </span>
        </div>
        <Progress value={pct} className="mt-1 h-1.5" />
        {!tier.unlocked && (
          <CardDescription>Complete the previous tier to unlock these lessons.</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {tier.lessons.map((lesson) => (
            <LessonRow key={lesson.slug} tier={tier.tier} lesson={lesson} locked={!tier.unlocked} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function LessonRow({
  tier,
  lesson,
  locked,
}: {
  tier: string;
  lesson: LearningPathLesson;
  locked: boolean;
}) {
  const Icon = LESSON_ICON[lesson.type];
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          lesson.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-600" : "bg-primary/10 text-primary",
        )}
      >
        {lesson.status === "COMPLETED" ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{lesson.title}</span>
        <span className="block text-xs capitalize text-muted-foreground">
          {lesson.type.replace("_", " ").toLowerCase()}
          {lesson.status === "IN_PROGRESS" && " · in progress"}
        </span>
      </span>
      {!locked && <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
    </div>
  );

  if (locked) return <li className="cursor-not-allowed">{inner}</li>;
  return (
    <li>
      <Link
        href={`/learn/${tier.toLowerCase()}/${lesson.slug}`}
        className="block transition hover:bg-accent/40"
      >
        {inner}
      </Link>
    </li>
  );
}
