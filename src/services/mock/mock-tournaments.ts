import type {
  CreateTournamentInput,
  Tournament,
  TournamentPlayer,
  TournamentRound,
  TournamentStatus,
  TournamentSummary,
} from "@/types";
import type { TournamentService } from "../tournament-service";
import { MOCK_CURRENT_USER, MOCK_USERS } from "./mock-data";

/**
 * Offline stand-in for the tournaments API. Mirrors registration + seeding +
 * round-1 pairing (top seed byes on an odd field); it does not simulate games
 * finishing, so brackets stay on round 1 in mock mode.
 */

let seq = 0;
const uid = (p: string) => `${p}_${++seq}`;

function player(userId: string, username: string): TournamentPlayer {
  return { id: uid("tp"), userId, username, avatar: null, seed: null, eliminatedInRound: null, finalPlacement: null };
}

const store: Tournament[] = [
  {
    id: "mock-open",
    name: "Saturday Blitz Arena",
    format: "SINGLE_ELIMINATION",
    status: "REGISTRATION",
    maxPlayers: 8,
    playerCount: 3,
    timeControl: "5+3",
    createdByUserId: MOCK_USERS[0].id,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    championUserId: null,
    players: [
      player(MOCK_USERS[0].id, MOCK_USERS[0].username),
      player(MOCK_USERS[1].id, MOCK_USERS[1].username),
      player(MOCK_USERS[3].id, MOCK_USERS[3].username),
    ],
    rounds: [],
    viewer: { isRegistered: false, isCreator: false, canJoin: true, canLeave: false, canStart: false },
  },
  {
    id: "mock-live",
    name: "Midweek Rapid Cup",
    format: "SINGLE_ELIMINATION",
    status: "IN_PROGRESS",
    maxPlayers: 4,
    playerCount: 4,
    timeControl: "10+0",
    createdByUserId: MOCK_USERS[3].id,
    startedAt: new Date(Date.now() - 1800_000).toISOString(),
    completedAt: null,
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
    championUserId: null,
    players: [3, 0, 7, 8].map((i, idx) => ({
      ...player(MOCK_USERS[i].id, MOCK_USERS[i].username),
      seed: idx + 1,
    })),
    rounds: [],
    viewer: { isRegistered: false, isCreator: false, canJoin: false, canLeave: false, canStart: false },
  },
];

// Give the live mock tournament a round-1 bracket.
{
  const t = store[1];
  t.rounds = [
    {
      roundNumber: 1,
      status: "PENDING",
      pairings: [
        {
          id: uid("pr"),
          roundNumber: 1,
          player1: shallow(t.players[0]),
          player2: shallow(t.players[3]),
          winnerId: t.players[0].id,
          isBye: false,
          gameId: "mock-game-1",
          gameStatus: "COMPLETED",
        },
        {
          id: uid("pr"),
          roundNumber: 1,
          player1: shallow(t.players[1]),
          player2: shallow(t.players[2]),
          winnerId: null,
          isBye: false,
          gameId: "mock-game-2",
          gameStatus: "ACTIVE",
        },
      ],
    },
  ];
}

function shallow(p: TournamentPlayer) {
  return { id: p.id, userId: p.userId, username: p.username };
}

function withViewer(t: Tournament): Tournament {
  const me = MOCK_CURRENT_USER.id;
  const registered = t.players.some((p) => p.userId === me);
  const isCreator = t.createdByUserId === me;
  const full = t.players.length >= t.maxPlayers;
  return {
    ...t,
    playerCount: t.players.length,
    viewer: {
      isRegistered: registered,
      isCreator,
      canJoin: t.status === "REGISTRATION" && !registered && !full,
      canLeave: t.status === "REGISTRATION" && registered,
      canStart: t.status === "REGISTRATION" && isCreator && t.players.length >= 2,
    },
  };
}

function summary(t: Tournament): TournamentSummary {
  return {
    id: t.id,
    name: t.name,
    format: t.format,
    status: t.status,
    maxPlayers: t.maxPlayers,
    playerCount: t.players.length,
    timeControl: t.timeControl,
    createdByUserId: t.createdByUserId,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    createdAt: t.createdAt,
    championUserId: t.championUserId,
  };
}

function pairRound(players: TournamentPlayer[]): TournamentRound {
  const sorted = [...players].sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));
  const pairings: TournamentRound["pairings"] = [];
  let field = sorted;
  if (field.length % 2 === 1) {
    const [bye, ...rest] = field;
    pairings.push({
      id: uid("pr"),
      roundNumber: 1,
      player1: shallow(bye),
      player2: null,
      winnerId: bye.id,
      isBye: true,
      gameId: null,
      gameStatus: null,
    });
    field = rest;
  }
  for (let i = 0; i < field.length / 2; i++) {
    pairings.push({
      id: uid("pr"),
      roundNumber: 1,
      player1: shallow(field[i]),
      player2: shallow(field[field.length - 1 - i]),
      winnerId: null,
      isBye: false,
      gameId: uid("mock-game"),
      gameStatus: "ACTIVE",
    });
  }
  return { roundNumber: 1, status: "PENDING", pairings };
}

export const mockTournaments: TournamentService = {
  async list(status?: TournamentStatus) {
    return store
      .filter((t) => (status ? t.status === status : true))
      .map((t) => summary(withViewer(t)));
  },

  async get(id) {
    const t = store.find((x) => x.id === id);
    if (!t) throw new Error("Tournament not found");
    return withViewer(t);
  },

  async create(input: CreateTournamentInput) {
    const t: Tournament = {
      id: uid("mock-t"),
      name: input.name,
      format: "SINGLE_ELIMINATION",
      status: "REGISTRATION",
      maxPlayers: input.maxPlayers,
      playerCount: 1,
      timeControl: input.timeControl,
      createdByUserId: MOCK_CURRENT_USER.id,
      startedAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      championUserId: null,
      players: [player(MOCK_CURRENT_USER.id, MOCK_CURRENT_USER.username)],
      rounds: [],
      viewer: { isRegistered: true, isCreator: true, canJoin: false, canLeave: true, canStart: false },
    };
    store.unshift(t);
    return withViewer(t);
  },

  async join(id) {
    const t = store.find((x) => x.id === id);
    if (!t) throw new Error("Tournament not found");
    if (!t.players.some((p) => p.userId === MOCK_CURRENT_USER.id)) {
      t.players.push(player(MOCK_CURRENT_USER.id, MOCK_CURRENT_USER.username));
    }
    return withViewer(t);
  },

  async leave(id) {
    const t = store.find((x) => x.id === id);
    if (!t) throw new Error("Tournament not found");
    t.players = t.players.filter((p) => p.userId !== MOCK_CURRENT_USER.id);
    return withViewer(t);
  },

  async start(id) {
    const t = store.find((x) => x.id === id);
    if (!t) throw new Error("Tournament not found");
    const ratingOf = (userId: string) =>
      MOCK_USERS.find((u) => u.id === userId)?.rating ?? MOCK_CURRENT_USER.rating;
    t.players = [...t.players]
      .sort((a, b) => ratingOf(b.userId) - ratingOf(a.userId))
      .map((p, i) => ({ ...p, seed: i + 1 }));
    t.status = "IN_PROGRESS";
    t.startedAt = new Date().toISOString();
    t.rounds = [pairRound(t.players)];
    return withViewer(t);
  },
};
