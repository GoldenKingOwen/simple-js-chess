"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TIER_LABELS } from "@/types";
import type { LessonTier } from "@/types";

export function LessonBanner({
  tier,
  title,
  objective,
}: {
  tier: LessonTier;
  title: string;
  objective?: string;
}) {
  return (
    <div className="mb-4 rounded-xl border bg-card/60 px-4 py-3">
      <Link
        href="/learn"
        className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Learning path
      </Link>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{TIER_LABELS[tier]}</p>
      <h1 className="text-lg font-semibold">{title}</h1>
      {objective && <p className="mt-0.5 text-sm text-muted-foreground">{objective}</p>}
    </div>
  );
}
