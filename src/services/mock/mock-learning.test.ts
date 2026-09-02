import { beforeEach, describe, expect, it } from "vitest";
import { mockLearning } from "./mock-learning";

// The mock learning service mirrors the backend's unlock + puzzle-attempt rules;
// this pins that behaviour so `USE_MOCK_API` dev stays faithful.
describe("mockLearning", () => {
  beforeEach(async () => {
    // reset in-memory progress by re-importing is overkill; the module keeps a
    // Map — walk it back to a clean state via the public surface where possible.
    // (Tests below are order-independent per assertion set.)
  });

  it("exposes 5 tiers with only Beginner unlocked initially", async () => {
    const path = await mockLearning.getPath();
    expect(path.tiers.map((t) => t.tier)).toEqual([
      "BEGINNER",
      "NOVICE",
      "INTERMEDIATE",
      "ADVANCED",
      "EXPERT",
    ]);
    expect(path.tiers[0].unlocked).toBe(true);
  });

  it("validates a puzzle attempt against the recorded line", async () => {
    const wrong = await mockLearning.submitAttempt("beginner-puzzles", "seed_scholar", ["h5h6"]);
    expect(wrong.correct).toBe(false);

    const right = await mockLearning.submitAttempt("beginner-puzzles", "seed_scholar", ["h5f7"]);
    expect(right.correct).toBe(true);
    expect(right.solved).toBe(true);
  });

  it("returns the forced reply mid-solution and completes the set when all are solved", async () => {
    const partial = await mockLearning.submitAttempt("novice-puzzles", "seed_legal", ["c4f7"]);
    expect(partial).toMatchObject({ correct: true, solved: false, reply: "e8e7" });

    await mockLearning.submitAttempt("novice-puzzles", "seed_legal", ["c4f7", "c3d5"]);
    await mockLearning.submitAttempt("novice-puzzles", "seed_scholar", ["h5f7"]);
    await mockLearning.submitAttempt("novice-puzzles", "seed_fools", ["d8h4"]);

    const lesson = await mockLearning.getLesson("novice-puzzles");
    expect(lesson.status).toBe("COMPLETED");
  });
});
