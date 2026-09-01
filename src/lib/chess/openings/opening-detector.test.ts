import { describe, expect, it } from "vitest";
import { detectOpening } from "./opening-detector";

// NOTE: tolerant matchers (contains / prefix) so these survive Lichess dataset
// updates. Tighten once the full book is generated from the vendored TSVs.
describe("detectOpening", () => {
  it("recognizes a single first move", () => {
    const match = detectOpening(["c4"]);
    expect(match).not.toBeNull();
    expect(match?.eco).toBe("A10");
    expect(match?.name).toContain("English");
    expect(match?.matchedPly).toBe(1);
  });

  it("refines as the line deepens", () => {
    const shallow = detectOpening(["c4"]);
    const deeper = detectOpening(["c4", "e5"]);
    expect(deeper?.matchedPly).toBe(2);
    expect(deeper?.name).toContain("English");
    expect(deeper!.matchedPly).toBeGreaterThan(shallow!.matchedPly);
  });

  it("matches a deep mainline (Ruy Lopez)", () => {
    const match = detectOpening(["e4", "e5", "Nf3", "Nc6", "Bb5"]);
    expect(match?.eco.startsWith("C6")).toBe(true);
    expect(match?.matchedPly).toBe(5);
  });

  it("returns the last matching prefix once the game leaves book", () => {
    const match = detectOpening(["e4", "e5", "Qh5", "Ke7"]);
    expect(match).not.toBeNull();
    expect(match?.matchedPly).toBe(2);
  });

  it("returns null before any known line matches", () => {
    expect(detectOpening([])).toBeNull();
    expect(detectOpening(["Ke2"])).toBeNull();
  });
});
