import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardCoordinates } from "./board-coordinates";

describe("BoardCoordinates", () => {
  it("renders file and rank labels from white perspective", () => {
    const { container } = render(<BoardCoordinates lightColor="#fff" darkColor="#000" />);
    const spans = container.querySelectorAll("span");
    expect(spans).toHaveLength(16);

    for (const file of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      expect(screen.getByText(file, { selector: "span" })).toBeInTheDocument();
    }
    for (const rank of ["8", "7", "6", "5", "4", "3", "2", "1"]) {
      expect(screen.getByText(rank, { selector: "span" })).toBeInTheDocument();
    }
  });

  it("flips the rank order for black perspective", () => {
    const { container } = render(<BoardCoordinates flipped lightColor="#fff" darkColor="#000" />);
    const spans = Array.from(container.querySelectorAll("span"));
    const firstRank = spans[8];
    expect(firstRank).toHaveTextContent("1");
  });

  it("applies the light/dark tone per square color", () => {
    const { container } = render(<BoardCoordinates lightColor="#eee" darkColor="#111" />);
    const fileLabels = Array.from(container.querySelectorAll("span")).slice(0, 8);
    // File "a" sits on a dark square (a1 dark): darkColor.
    expect(fileLabels[0]).toHaveStyle({ color: "#111" });
    // File "b" is light.
    expect(fileLabels[1]).toHaveStyle({ color: "#eee" });
  });
});