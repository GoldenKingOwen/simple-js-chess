import type { TimeControl, TimeControlId } from "@/types";

export const TIME_CONTROLS: Record<TimeControlId, TimeControl> = {
  bullet: {
    id: "bullet",
    label: "Bullet",
    timeMs: 60_000,
    incrementMs: 1_000,
  },
  blitz: {
    id: "blitz",
    label: "Blitz",
    timeMs: 180_000,
    incrementMs: 2_000,
  },
  rapid: {
    id: "rapid",
    label: "Rapid",
    timeMs: 600_000,
    incrementMs: 5_000,
  },
  classical: {
    id: "classical",
    label: "Classical",
    timeMs: 1_800_000,
    incrementMs: 0,
  },
  casual: {
    id: "casual",
    label: "Casual",
    timeMs: 900_000,
    incrementMs: 0,
  },
};

export const TIME_CONTROL_LIST = Object.values(TIME_CONTROLS);

export function getTimeControl(id: TimeControlId): TimeControl {
  return TIME_CONTROLS[id] ?? TIME_CONTROLS.rapid;
}

const TIME_UNITS = 1_000;

/** Format milliseconds as mm:ss (e.g. "05:00"). */
export function formatTimeMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / TIME_UNITS));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const secString = pad(seconds);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}:${pad(remMinutes)}:${secString}`;
  }
  return `${minutes}:${secString}`;
}

export function timeControlLabel(id: TimeControlId): string {
  const tc = getTimeControl(id);
  const minutes = tc.timeMs / 60_000;
  const inc = tc.incrementMs / 1_000;
  return inc > 0 ? `${tc.label} ${minutes} + ${inc}` : `${tc.label} ${minutes}`;
}