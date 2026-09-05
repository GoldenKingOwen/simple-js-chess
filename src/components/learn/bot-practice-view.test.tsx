import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BotPracticeView } from "@/app/learn/[tier]/[lessonId]/lesson-client";
import type { Lesson } from "@/types";

const completeLesson = vi.fn();
const startPractice = vi.fn();

vi.mock("@/services/learning-service", () => ({
  learningService: {
    completeLesson: (...a: unknown[]) => completeLesson(...a),
    startPractice: (...a: unknown[]) => startPractice(...a),
  },
}));

// The real game screen opens sockets + REST — not what this test is about.
vi.mock("@/app/game/[gameId]/online-game-client", () => ({
  OnlineGameClient: () => <div data-testid="game-screen" />,
}));

const lesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  slug: "beginner-checkmate-the-bot",
  title: "Checkmate the beginner bot",
  type: "BOT_PRACTICE",
  tier: "BEGINNER",
  status: "IN_PROGRESS",
  botPractice: { objective: "Finish with checkmate.", difficulty: "beginner", gameId: "g1" },
  ...overrides,
});

function renderView(l: Lesson, onChange = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <BotPracticeView lesson={l} onChange={onChange} />
    </QueryClientProvider>,
  );
  return { onChange };
}

describe("BotPracticeView", () => {
  beforeEach(() => {
    completeLesson.mockReset();
    startPractice.mockReset();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("auto-checks the objective while a game is in progress and completes on met", async () => {
    completeLesson.mockResolvedValueOnce({ met: false, status: "IN_PROGRESS", reason: "Finish the game." });
    completeLesson.mockResolvedValue({ met: true, status: "COMPLETED" });

    const { onChange } = renderView(lesson());

    // Fires once immediately on mount.
    await vi.waitFor(() => expect(completeLesson).toHaveBeenCalledWith("beginner-checkmate-the-bot"));
    expect(screen.queryByText(/lesson complete/i)).toBeNull();

    // Next poll tick reports the objective met.
    await vi.advanceTimersByTimeAsync(6000);
    await vi.waitFor(() => expect(screen.getByText(/lesson complete/i)).toBeInTheDocument());
    expect(onChange).toHaveBeenCalled();
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === "/learn")).toBe(true);
    // The manual "check objective" fallback is hidden once complete.
    expect(screen.queryByRole("button", { name: /check objective/i })).toBeNull();
  });

  it("does not poll once the lesson is already COMPLETED", async () => {
    renderView(lesson({ status: "COMPLETED" }));
    await vi.advanceTimersByTimeAsync(15000);
    expect(completeLesson).not.toHaveBeenCalled();
    expect(screen.getByText(/lesson complete/i)).toBeInTheDocument();
  });

  it("shows a start button (no game yet) instead of polling", async () => {
    renderView(lesson({ botPractice: { objective: "x", difficulty: "beginner", gameId: null } }));
    await vi.advanceTimersByTimeAsync(15000);
    expect(completeLesson).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /start practice game/i })).toBeInTheDocument();
  });
});
