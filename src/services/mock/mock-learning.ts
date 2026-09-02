import type {
  Lesson,
  LearningPath,
  LearningPathTier,
  LessonCompletionResult,
  LessonStatus,
  LessonTier,
  LessonType,
  PuzzleAttemptResult,
} from "@/types";
import type { LearningService } from "../learning-service";

/**
 * Offline stand-in for the learning API. Mirrors the backend curriculum slugs +
 * unlock rules so `USE_MOCK_API` dev keeps working without a backend. Progress
 * is in-memory only.
 */

const TIER_ORDER: LessonTier[] = ["BEGINNER", "NOVICE", "INTERMEDIATE", "ADVANCED", "EXPERT"];

interface Def {
  slug: string;
  tier: LessonTier;
  order: number;
  type: LessonType;
  title: string;
  concept?: { text: string; fen: string };
  puzzleIds?: string[];
  botPractice?: { objective: string; difficulty: string };
}

const PUZZLES: Record<string, { fen: string; sideToMove: "w" | "b"; moves: string[]; rating: number; themes: string[] }> = {
  seed_scholar: {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    sideToMove: "w", moves: ["h5f7"], rating: 500, themes: ["mate", "mateIn1"],
  },
  seed_fools: {
    fen: "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2",
    sideToMove: "b", moves: ["d8h4"], rating: 500, themes: ["mate", "mateIn1"],
  },
  seed_legal: {
    fen: "r2qkbnr/ppp2ppp/2np4/4N3/2B1P3/2N5/PPPP1PPP/R1BbK2R w KQkq - 0 6",
    sideToMove: "w", moves: ["c4f7", "e8e7", "c3d5"], rating: 1600, themes: ["mate", "sacrifice"],
  },
};

const DEFS: Def[] = TIER_ORDER.flatMap((tier, ti) => [
  {
    slug: `${tier.toLowerCase()}-concept`,
    tier, order: 1, type: "CONCEPT" as LessonType,
    title: `${tier[0]}${tier.slice(1).toLowerCase()} idea`,
    concept: {
      text: "Control the centre, develop toward it, and keep your king safe. (Mock lesson content.)",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    },
  },
  {
    slug: `${tier.toLowerCase()}-puzzles`,
    tier, order: 2, type: "PUZZLE_SET" as LessonType,
    title: `${tier[0]}${tier.slice(1).toLowerCase()} tactics`,
    puzzleIds: ["seed_scholar", "seed_fools", "seed_legal"].slice(0, ti === 0 ? 2 : 3),
  },
  {
    slug: `${tier.toLowerCase()}-practice`,
    tier, order: 3, type: "BOT_PRACTICE" as LessonType,
    title: `Play the ${["beginner", "easy", "medium", "hard", "expert"][ti]} bot`,
    botPractice: {
      objective: "Finish a full game against the bot.",
      difficulty: ["beginner", "easy", "medium", "hard", "expert"][ti],
    },
  },
]);

const progress = new Map<string, { status: LessonStatus; solved: string[]; gameId: string | null }>();

function prog(slug: string) {
  let p = progress.get(slug);
  if (!p) {
    p = { status: "NOT_STARTED", solved: [], gameId: null };
    progress.set(slug, p);
  }
  return p;
}

function tierUnlocked(tier: LessonTier): boolean {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx <= 0) return true;
  const prev = TIER_ORDER[idx - 1];
  return DEFS.filter((d) => d.tier === prev).every((d) => prog(d.slug).status === "COMPLETED");
}

export const mockLearning: LearningService = {
  async getPath(): Promise<LearningPath> {
    const tiers: LearningPathTier[] = TIER_ORDER.map((tier) => {
      const lessons = DEFS.filter((d) => d.tier === tier);
      return {
        tier,
        unlocked: tierUnlocked(tier),
        completed: lessons.every((d) => prog(d.slug).status === "COMPLETED"),
        lessons: lessons.map((d) => ({
          slug: d.slug, title: d.title, type: d.type, order: d.order,
          status: prog(d.slug).status,
        })),
      };
    });
    return { tiers };
  },

  async getLesson(slug): Promise<Lesson> {
    const def = DEFS.find((d) => d.slug === slug);
    if (!def) throw new Error("Lesson not found");
    const p = prog(slug);
    if (p.status === "NOT_STARTED") p.status = "IN_PROGRESS";
    const base = { slug: def.slug, title: def.title, type: def.type, tier: def.tier, status: p.status };
    if (def.type === "CONCEPT") return { ...base, concept: def.concept };
    if (def.type === "PUZZLE_SET") {
      const ids = def.puzzleIds ?? [];
      return {
        ...base,
        puzzleSet: {
          required: ids.length,
          solvedCount: ids.filter((id) => p.solved.includes(id)).length,
          puzzles: ids.map((id) => ({
            id, fen: PUZZLES[id].fen, sideToMove: PUZZLES[id].sideToMove,
            rating: PUZZLES[id].rating, themes: PUZZLES[id].themes,
            solved: p.solved.includes(id),
          })),
        },
      };
    }
    return { ...base, botPractice: { ...def.botPractice!, gameId: p.gameId } };
  },

  async submitAttempt(slug, puzzleId, moves): Promise<PuzzleAttemptResult> {
    const def = DEFS.find((d) => d.slug === slug);
    const puzzle = PUZZLES[puzzleId];
    if (!def || !puzzle) return { correct: false, solved: false };
    const total = Math.ceil(puzzle.moves.length / 2);
    for (let i = 0; i < moves.length; i++) {
      if (moves[i] !== puzzle.moves[i * 2]) return { correct: false, solved: false };
    }
    const solved = moves.length >= total;
    const p = prog(slug);
    if (solved && !p.solved.includes(puzzleId)) p.solved.push(puzzleId);
    const ids = def.puzzleIds ?? [];
    const solvedCount = ids.filter((id) => p.solved.includes(id)).length;
    if (solvedCount >= ids.length) p.status = "COMPLETED";
    return {
      correct: true,
      solved,
      reply: solved ? undefined : puzzle.moves[(moves.length - 1) * 2 + 1],
      solvedPuzzleIds: [...p.solved],
      solvedCount,
      required: ids.length,
      lessonStatus: p.status,
    };
  },

  async startPractice(slug): Promise<{ gameId: string }> {
    const p = prog(slug);
    if (!p.gameId) p.gameId = `mock-${slug}`;
    return { gameId: p.gameId };
  },

  async completeLesson(slug): Promise<LessonCompletionResult> {
    const def = DEFS.find((d) => d.slug === slug);
    const p = prog(slug);
    if (def?.type === "BOT_PRACTICE" && !p.gameId) {
      return { status: p.status, met: false, reason: "Start the practice game first." };
    }
    p.status = "COMPLETED";
    return { status: "COMPLETED", met: true };
  },
};
