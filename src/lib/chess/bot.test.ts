import { describe, expect, it } from "vitest";
import { ChessEngine } from "./chess-engine";
import { LocalChessBot, botName, botThinkDelay } from "./bot";
import type { BotDifficulty } from "@/types";

describe("LocalChessBot", () => {
  it("returns a legal SAN move for the starting position", async () => {
    const bot = new LocalChessBot("expert", "b");
    const engine = new ChessEngine();
    const san = await bot.getMove(engine.fen());
    expect(engine.moves()).toContain(san);
  });

  it("captures a hanging bishop when available", async () => {
    const bot = new LocalChessBot("expert", "b");
    // White bishop on b5 is attacked by the c6 pawn and undefended.
    const fen = "rnbqkbnr/pp1p1ppp/2p5/1B2p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const san = await bot.getMove(fen);
    expect(san).toBe("cxb5");
  });

  it("plays a checkmating move when one exists", async () => {
    const bot = new LocalChessBot("expert", "b");
    // Fool's mate: 1.f3 e5 2.g4 and black has Qh4#.
    const fen = "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2";
    const san = await bot.getMove(fen);
    expect(san).toBe("Qh4#");
  });

  it("maps every difficulty to a thinking delay", () => {
    const delays: Record<BotDifficulty, number> = {
      beginner: 350,
      easy: 500,
      medium: 700,
      hard: 950,
      expert: 1200,
    };
    for (const [difficulty, expected] of Object.entries(delays)) {
      expect(botThinkDelay(difficulty as BotDifficulty)).toBe(expected);
    }
  });

  it("produces human-readable names", () => {
    expect(botName("medium")).toBe("Medium Bot");
    expect(botName("expert")).toBe("Expert Bot");
  });
});