import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ChessPieceIcon } from "./pieces";
import type { Color, PieceSymbol } from "@/lib/chess/chess-engine";

const TYPES: PieceSymbol[] = ["k", "q", "r", "b", "n", "p"];
const COLORS: Color[] = ["w", "b"];

describe("ChessPieceIcon", () => {
  it("renders SVG artwork for every piece type and color", () => {
    for (const type of TYPES) {
      for (const color of COLORS) {
        const { container } = render(<ChessPieceIcon type={type} color={color} />);
        const svg = container.querySelector("svg");
        expect(svg, `expected an <svg> for ${color}${type}`).not.toBeNull();
        expect(svg?.querySelectorAll("path, circle").length ?? 0, `expected artwork for ${color}${type}`).toBeGreaterThan(0);
      }
    }
  });

  it("renders a unicode glyph in unicode style", () => {
    const { container } = render(<ChessPieceIcon type="k" color="w" style="unicode" />);
    expect(container.textContent).toBe("♔");
    expect(container.querySelector("svg")).toBeNull();
  });
});
