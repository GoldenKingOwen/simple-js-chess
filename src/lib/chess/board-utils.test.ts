import { describe, expect, it } from "vitest";
import { ChessEngine } from "./chess-engine";
import { renderBoard } from "./board-utils";

describe("renderBoard", () => {
  it("assigns a unique square to every cell, including empty ones", () => {
    const engine = new ChessEngine();
    const squares = renderBoard(engine.board()).flat().map((cell) => cell.square);

    expect(squares).toHaveLength(64);
    expect(new Set(squares).size).toBe(64);
  });

  it("orders squares rank 8 at the top from white's perspective", () => {
    const engine = new ChessEngine();
    const rows = renderBoard(engine.board());

    expect(rows[0].map((cell) => cell.square)).toEqual(["a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"]);
    expect(rows[7].map((cell) => cell.square)).toEqual(["a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1"]);
  });

  it("flips the rank order for black's perspective", () => {
    const engine = new ChessEngine();
    const rows = renderBoard(engine.board(), true);

    expect(rows[0].map((cell) => cell.square)).toEqual(["a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1"]);
    expect(rows[7].map((cell) => cell.square)).toEqual(["a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"]);
  });

  it("keeps piece data on occupied squares", () => {
    const engine = new ChessEngine();
    const rows = renderBoard(engine.board());

    const e2 = rows[6][4]; // rank 2, file e
    expect(e2.square).toBe("e2");
    expect(e2.piece).toEqual({ type: "p", color: "w" });

    const e4 = rows[4][4]; // empty square
    expect(e4.square).toBe("e4");
    expect(e4.piece).toBeNull();
  });
});
