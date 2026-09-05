"use client";

import {
  Award,
  Bot,
  Flame,
  GraduationCap,
  Lock,
  Swords,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Achievement } from "@/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  TrendingUp,
  Flame,
  Swords,
  Bot,
  Trophy,
  GraduationCap,
};

interface BadgeGridProps {
  achievements: Achievement[];
  /** Hide locked badges entirely (used on other people's profiles). */
  earnedOnly?: boolean;
  className?: string;
}

export function BadgeGrid({ achievements, earnedOnly, className }: BadgeGridProps) {
  const shown = earnedOnly ? achievements.filter((a) => a.earned) : achievements;
  const earnedCount = achievements.filter((a) => a.earned).length;

  if (shown.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-muted-foreground">
        {earnedOnly ? "No badges earned yet." : "Play, learn, and compete to unlock badges."}
      </p>
    );
  }

  return (
    <TooltipProvider>
      <div className={className}>
        {!earnedOnly && (
          <p className="mb-3 text-xs text-muted-foreground">
            {earnedCount} of {achievements.length} unlocked
          </p>
        )}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {shown.map((achievement) => (
            <BadgeItem key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

function BadgeItem({ achievement }: { achievement: Achievement }) {
  const Icon = ICONS[achievement.icon] ?? Award;
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition",
          achievement.earned
            ? "border-primary/30 bg-primary/5 text-foreground"
            : "border-dashed bg-muted/30 text-muted-foreground",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            achievement.earned ? "bg-primary/15 text-primary" : "bg-muted",
          )}
        >
          {achievement.earned ? (
            <Icon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>
        <span className="line-clamp-2 text-[11px] font-medium leading-tight">{achievement.name}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{achievement.name}</p>
        <p className="text-xs text-muted-foreground">{achievement.description}</p>
        {achievement.earned && achievement.earnedAt && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Earned {new Date(achievement.earnedAt).toLocaleDateString()}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
