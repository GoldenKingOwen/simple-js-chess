import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PuzzleRunner } from "./puzzle-runner";
import type { LessonPuzzle } from "@/types";

const submitAttempt = vi.fn();
vi.mock("@/services/learning-service", () => ({
  learningService: {
    submitAttempt: (...args: unknown[]) => submitAttempt(...args),
  },
}));

const scholar: LessonPuzzle = {
  id: "seed_scholar",
  fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
  sideToMove: "w",
  rating: 500,
  themes: ["mate"],
  solved: false,
};

function playMove(container: HTMLElement, from: string, to: string) {
  fireEvent.click(container.querySelector(`[data-square="${from}"]`)!);
  fireEvent.click(container.querySelector(`[data-square="${to}"]`)!);
}

describe("PuzzleRunner", () => {
  beforeEach(() => submitAttempt.mockReset());

  it("submits the played move and shows success + completes on solve", async () => {
    submitAttempt.mockResolvedValue({
      correct: true,
      solved: true,
      solvedPuzzleIds: ["seed_scholar"],
      solvedCount: 1,
      required: 1,
      lessonStatus: "COMPLETED",
    });
    const onComplete = vi.fn();
    const { container } = render(
      <PuzzleRunner
        slug="beginner-puzzles"
        puzzles={[scholar]}
        required={1}
        onProgress={vi.fn()}
        onComplete={onComplete}
      />,
    );

    playMove(container, "h5", "f7");

    await waitFor(() =>
      expect(submitAttempt).toHaveBeenCalledWith("beginner-puzzles", "seed_scholar", ["h5f7"]),
    );
    await waitFor(() => expect(screen.getByText("Solved!")).toBeInTheDocument());
    await waitFor(() => expect(onComplete).toHaveBeenCalled(), { timeout: 1500 });
  });

  it("reverts and warns on a wrong move", async () => {
    submitAttempt.mockResolvedValue({ correct: false, solved: false });
    const { container } = render(
      <PuzzleRunner
        slug="beginner-puzzles"
        puzzles={[scholar]}
        required={1}
        onProgress={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    playMove(container, "h5", "h6");

    await waitFor(() =>
      expect(submitAttempt).toHaveBeenCalledWith("beginner-puzzles", "seed_scholar", ["h5h6"]),
    );
    await waitFor(() => expect(screen.getByText(/not the move/i)).toBeInTheDocument());
  });

  it("advances a multi-move line, animating the forced reply", async () => {
    const legal: LessonPuzzle = {
      id: "seed_legal",
      fen: "r2qkbnr/ppp2ppp/2np4/4N3/2B1P3/2N5/PPPP1PPP/R1BbK2R w KQkq - 0 6",
      sideToMove: "w",
      rating: 1600,
      themes: ["mate"],
      solved: false,
    };
    submitAttempt.mockResolvedValueOnce({ correct: true, solved: false, reply: "e8e7" });

    const { container } = render(
      <PuzzleRunner
        slug="advanced-puzzles"
        puzzles={[legal]}
        required={1}
        onProgress={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    playMove(container, "c4", "f7");
    await waitFor(() =>
      expect(submitAttempt).toHaveBeenCalledWith("advanced-puzzles", "seed_legal", ["c4f7"]),
    );
    // Forced reply animates the black king to e7.
    await waitFor(() =>
      expect(container.querySelector('[data-square="e7"]')?.getAttribute("data-chess-piece")).toBe("b:k"),
    );
  });
});
