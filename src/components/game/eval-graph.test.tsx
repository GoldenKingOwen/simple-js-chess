import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EvalGraph } from "./eval-graph";
import type { AnalyzedPly } from "@/types";

const ply = (over: Partial<AnalyzedPly>): AnalyzedPly => ({
  ply: 0,
  moveNumber: 1,
  color: "WHITE",
  san: "e4",
  playedUci: "e2e4",
  bestUci: "e2e4",
  bestEvalCp: 20,
  playedEvalCp: 20,
  cpLoss: 0,
  classification: "GOOD",
  missedBest: false,
  ...over,
});

describe("EvalGraph", () => {
  it("renders nothing without plies", () => {
    const { container } = render(<EvalGraph plies={[]} position={-1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an svg and marks mistakes/blunders", () => {
    const plies = [
      ply({ ply: 0, classification: "GOOD" }),
      ply({ ply: 1, color: "BLACK", classification: "BLUNDER", cpLoss: 400 }),
      ply({ ply: 2, classification: "MISTAKE", cpLoss: 150 }),
    ];
    const { container } = render(<EvalGraph plies={plies} position={0} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    // one dot per non-good ply
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("seeks when the slider moves", () => {
    const onSeek = vi.fn();
    render(<EvalGraph plies={[ply({}), ply({ ply: 1 })]} position={-1} onSeek={onSeek} />);
    fireEvent.change(screen.getByLabelText(/seek in evaluation graph/i), { target: { value: "1" } });
    expect(onSeek).toHaveBeenCalledWith(1);
  });
});
