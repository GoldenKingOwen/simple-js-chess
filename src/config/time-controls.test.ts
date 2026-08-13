import { describe, expect, it } from "vitest";
import { TIME_CONTROLS, TIME_CONTROL_LIST, formatTimeMs, getTimeControl, timeControlLabel } from "./time-controls";

describe("time-controls", () => {
  it("exposes the full set of controls in a stable order", () => {
    expect(TIME_CONTROL_LIST.map((tc) => tc.id)).toEqual(["bullet", "blitz", "rapid", "classical", "casual"]);
  });

  it("looks up controls by id and falls back to rapid", () => {
    expect(getTimeControl("blitz").timeMs).toBe(180_000);
    expect(getTimeControl("casual").incrementMs).toBe(0);
    expect(getTimeControl("unknown" as never)).toEqual(TIME_CONTROLS.rapid);
  });

  it("formats milliseconds as mm:ss and h:mm:ss", () => {
    expect(formatTimeMs(0)).toBe("0:00");
    expect(formatTimeMs(5_000)).toBe("0:05");
    expect(formatTimeMs(60_000)).toBe("1:00");
    expect(formatTimeMs(5_999_000)).toBe("1:39:59");
    expect(formatTimeMs(-10)).toBe("0:00");
  });

  it("builds human-readable labels with increment", () => {
    expect(timeControlLabel("rapid")).toBe("Rapid 10 + 5");
    expect(timeControlLabel("casual")).toBe("Casual 15");
  });
});