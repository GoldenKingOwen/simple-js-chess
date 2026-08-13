import { describe, expect, it } from "vitest";
import { ChessEngine } from "./chess-engine";
import type { Square } from "./chess-engine";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("ChessEngine", () => {
  it("exposes the starting position", () => {
    const engine = new ChessEngine();
    expect(engine.fen()).toBe(STARTING_FEN);
    expect(engine.turn()).toBe("w");
    expect(engine.moves().length).toBe(20);
  });

  it("applies a move and flips the turn", () => {
    const engine = new ChessEngine();
    const move = engine.move({ from: "e2", to: "e4" });
    expect(move.san).toBe("e4");
    expect(engine.turn()).toBe("b");
    expect(engine.fen()).toContain(" b KQkq - 0 1");
  });

  it("rejects illegal moves", () => {
    const engine = new ChessEngine();
    expect(() => engine.move({ from: "e2", to: "e5" })).toThrow();
  });

  it("lists only legal moves for a square", () => {
    const engine = new ChessEngine();
    const moves = engine.movesBySquare("e2");
    expect(moves.map((m) => m.san).sort()).toEqual(["e3", "e4"]);
  });

  it("detects checkmate via scholar's mate", () => {
    const engine = new ChessEngine();
    engine.move({ from: "e2", to: "e4" });
    engine.move({ from: "e7", to: "e5" });
    engine.move({ from: "f1", to: "c4" });
    engine.move({ from: "b8", to: "c6" });
    engine.move({ from: "d1", to: "h5" });
    engine.move({ from: "g8", to: "f6" });
    engine.move({ from: "h5", to: "f7" }); // Qxf7#
    expect(engine.isCheckmate()).toBe(true);
    expect(engine.isGameOver()).toBe(true);
    expect(engine.result()).toEqual({ winner: "w", reason: "checkmate" });
  });

  it("detects check on the side to move", () => {
    const engine = new ChessEngine();
    engine.move({ from: "e2", to: "e4" });
    engine.move({ from: "f7", to: "f5" });
    engine.move({ from: "d1", to: "h5" }); // Qh5+ check
    expect(engine.isCheck()).toBe(true);
    expect(engine.kingSquareInCheck()).toBe("e8" as Square);
  });

  it("detects stalemate", () => {
    const engine = new ChessEngine(
      "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
    );
    expect(engine.isStalemate()).toBe(true);
    expect(engine.result()).toEqual({ winner: null, reason: "stalemate" });
  });

  it("handles castling kingside", () => {
    const engine = new ChessEngine(
      "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3",
    );
    engine.move({ from: "e1", to: "g1" });
    expect(engine.get("g1")).toMatchObject({ type: "k", color: "w" });
    expect(engine.get("f1")).toMatchObject({ type: "r", color: "w" });
  });

  it("round-trips a custom position and supports undo", () => {
    const engine = new ChessEngine(STARTING_FEN);
    const before = engine.fen();
    engine.move({ from: "g1", to: "f3" });
    expect(engine.fen()).not.toBe(before);
    const undone = engine.undo();
    expect(undone?.san).toBe("Nf3");
    expect(engine.fen()).toBe(before);
  });

  it("loads a FEN and reports failures", () => {
    const engine = new ChessEngine();
    expect(engine.load(STARTING_FEN).ok).toBe(true);
    expect(engine.load("not-a-fen").ok).toBe(false);
  });
});