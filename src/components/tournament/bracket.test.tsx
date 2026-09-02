import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Bracket } from "./bracket";
import type { TournamentRound } from "@/types";

const rounds: TournamentRound[] = [
  {
    roundNumber: 1,
    status: "COMPLETED",
    pairings: [
      {
        id: "p1",
        roundNumber: 1,
        player1: { id: "a", userId: "ua", username: "Ada" },
        player2: { id: "d", userId: "ud", username: "Dan" },
        winnerId: "a",
        isBye: false,
        gameId: "g1",
        gameStatus: "COMPLETED",
      },
      {
        id: "p2",
        roundNumber: 1,
        player1: { id: "b", userId: "ub", username: "Bea" },
        player2: null,
        winnerId: "b",
        isBye: true,
        gameId: null,
        gameStatus: null,
      },
    ],
  },
  {
    roundNumber: 2,
    status: "PENDING",
    pairings: [
      {
        id: "p3",
        roundNumber: 2,
        player1: { id: "a", userId: "ua", username: "Ada" },
        player2: { id: "b", userId: "ub", username: "Bea" },
        winnerId: null,
        isBye: false,
        gameId: "g2",
        gameStatus: "ACTIVE",
      },
    ],
  },
];

describe("Bracket", () => {
  it("names the last round the Final and shows a bye", () => {
    render(<Bracket rounds={rounds} currentUserId="ux" />);
    expect(screen.getByText("Final")).toBeInTheDocument();
    expect(screen.getByText("Bye")).toBeInTheDocument();
  });

  it("links the current user to their unfinished game", () => {
    render(<Bracket rounds={rounds} currentUserId="ua" />);
    const link = screen.getByRole("link", { name: /play your game/i });
    expect(link).toHaveAttribute("href", "/game/g2");
  });

  it("does not offer a game link to non-participants", () => {
    render(<Bracket rounds={rounds} currentUserId="ux" />);
    expect(screen.queryByRole("link", { name: /play your game/i })).toBeNull();
  });

  it("shows an empty state before the bracket exists", () => {
    render(<Bracket rounds={[]} />);
    expect(screen.getByText(/bracket appears here/i)).toBeInTheDocument();
  });
});
