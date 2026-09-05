import type { GameColor } from "./game";

export type LessonTier = "BEGINNER" | "NOVICE" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type LessonType = "CONCEPT" | "PUZZLE_SET" | "BOT_PRACTICE";
export type LessonStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface LearningPathLesson {
  slug: string;
  title: string;
  type: LessonType;
  order: number;
  status: LessonStatus;
}

export interface LearningPathTier {
  tier: LessonTier;
  unlocked: boolean;
  completed: boolean;
  lessons: LearningPathLesson[];
}

export interface LearningPath {
  tiers: LearningPathTier[];
}

export interface LessonPuzzle {
  id: string;
  fen: string;
  sideToMove: GameColor;
  rating: number;
  themes: string[];
  solved: boolean;
}

export interface Lesson {
  slug: string;
  title: string;
  type: LessonType;
  tier: LessonTier;
  status: LessonStatus;
  concept?: { text: string; fen: string; source?: string | null };
  puzzleSet?: { required: number; solvedCount: number; puzzles: LessonPuzzle[] };
  botPractice?: { objective: string; difficulty: string; gameId: string | null };
}

export interface PuzzleAttemptResult {
  correct: boolean;
  solved: boolean;
  /** Opponent's forced reply to animate, when the puzzle continues. */
  reply?: string;
  solvedPuzzleIds?: string[];
  solvedCount?: number;
  required?: number;
  lessonStatus?: LessonStatus;
}

export interface LessonCompletionResult {
  status: LessonStatus;
  met: boolean;
  reason?: string;
}

export const TIER_LABELS: Record<LessonTier, string> = {
  BEGINNER: "Beginner",
  NOVICE: "Novice",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
};
