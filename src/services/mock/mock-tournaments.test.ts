import { beforeEach, describe, expect, it } from "vitest";
import { mockTournaments } from "./mock-tournaments";

describe("mockTournaments", () => {
  it("filters the list by status", async () => {
    const open = await mockTournaments.list("REGISTRATION");
    expect(open.length).toBeGreaterThan(0);
    expect(open.every((t) => t.status === "REGISTRATION")).toBe(true);
  });

  it("join then leave toggles the viewer flags", async () => {
    const joined = await mockTournaments.join("mock-open");
    expect(joined.viewer.isRegistered).toBe(true);
    expect(joined.viewer.canJoin).toBe(false);
    const left = await mockTournaments.leave("mock-open");
    expect(left.viewer.isRegistered).toBe(false);
    expect(left.viewer.canJoin).toBe(true);
  });

  it("start seeds every player and generates round 1", async () => {
    const created = await mockTournaments.create({
      name: "Spec Cup",
      maxPlayers: 8,
      timeControl: "5+3",
    });
    const started = await mockTournaments.start(created.id);
    expect(started.status).toBe("IN_PROGRESS");
    expect(started.startedAt).toBeTruthy();
    expect(started.players.every((p) => typeof p.seed === "number")).toBe(true);
    expect(started.rounds).toHaveLength(1);
  });

  it("pairs an even field with no bye and gives an odd field's bye to the top seed", async () => {
    const live = await mockTournaments.get("mock-live"); // 4 seeded players, already started
    expect(live.rounds[0].pairings.filter((p) => p.isBye)).toHaveLength(0);
  });
});
