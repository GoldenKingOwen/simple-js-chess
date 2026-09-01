import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useChessGame } from "./use-chess-game";
import { LocalChessBot, botThinkDelay } from "@/lib/chess/bot";
import type { TimeControl } from "@/types/game";

const timeControl: TimeControl = {
  id: "rapid",
  label: "Rapid",
  timeMs: 600_000,
  incrementMs: 10_000,
};

async function flushTimers(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

describe("useChessGame (bot mode)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("makes the bot play the first move when the bot is white (player is black)", async () => {
    const bot = new LocalChessBot("beginner", "w");
    const { result } = renderHook(() =>
      useChessGame({ mode: "bot", timeControl, bot, botColor: "w", botDifficulty: "beginner" }),
    );

    expect(result.current.turn).toBe("w");
    expect(result.current.moves).toHaveLength(0);

    await flushTimers(botThinkDelay("beginner") + 50);

    expect(result.current.moves).toHaveLength(1);
    expect(result.current.moves[0].color).toBe("w");
    expect(result.current.turn).toBe("b");
    expect(result.current.botThinking).toBe(false);
  });

  it("does not move first when the bot is black, and replies after the player moves", async () => {
    const bot = new LocalChessBot("beginner", "b");
    const { result } = renderHook(() =>
      useChessGame({ mode: "bot", timeControl, bot, botColor: "b", botDifficulty: "beginner" }),
    );

    await flushTimers(botThinkDelay("beginner") + 50);
    expect(result.current.moves).toHaveLength(0);

    act(() => {
      result.current.makeMove("e2", "e4");
    });
    expect(result.current.moves).toHaveLength(1);

    await flushTimers(botThinkDelay("beginner") + 50);
    expect(result.current.moves).toHaveLength(2);
    expect(result.current.moves[1].color).toBe("b");
    expect(result.current.turn).toBe("w");
  });
});

describe("useChessGame (opening recognition)", () => {
  it("recognizes the opening live and keeps the last match after leaving book", () => {
    const { result } = renderHook(() => useChessGame({ mode: "local", timeControl }));

    expect(result.current.opening).toBeNull();

    act(() => result.current.makeMove("c2", "c4"));
    expect(result.current.opening?.name).toContain("English");

    act(() => result.current.makeMove("e7", "e5"));
    expect(result.current.opening?.name).toContain("English");
    expect(result.current.opening?.matchedPly).toBe(2);

    // A divergent move leaves book — the last confident match is kept, not cleared.
    act(() => result.current.makeMove("d1", "a4"));
    expect(result.current.opening?.name).toContain("English");
  });
});
