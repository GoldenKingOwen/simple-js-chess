export type TournamentStatus = "REGISTRATION" | "IN_PROGRESS" | "COMPLETED";
export type TournamentFormat = "SINGLE_ELIMINATION";

export interface TournamentSummary {
  id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  maxPlayers: number;
  playerCount: number;
  timeControl: string;
  createdByUserId: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  championUserId: string | null;
}

export interface TournamentPlayer {
  id: string;
  userId: string;
  username: string | null;
  avatar: string | null;
  seed: number | null;
  eliminatedInRound: number | null;
  finalPlacement: number | null;
}

export interface TournamentPairing {
  id: string;
  roundNumber: number;
  player1: { id: string; userId: string; username: string | null } | null;
  player2: { id: string; userId: string; username: string | null } | null;
  winnerId: string | null;
  isBye: boolean;
  gameId: string | null;
  gameStatus: string | null;
}

export interface TournamentRound {
  roundNumber: number;
  status: "PENDING" | "COMPLETED";
  pairings: TournamentPairing[];
}

export interface TournamentViewerFlags {
  isRegistered: boolean;
  isCreator: boolean;
  canJoin: boolean;
  canLeave: boolean;
  canStart: boolean;
}

export interface Tournament extends TournamentSummary {
  players: TournamentPlayer[];
  rounds: TournamentRound[];
  viewer: TournamentViewerFlags;
}

export interface CreateTournamentInput {
  name: string;
  maxPlayers: number;
  timeControl: string;
}
