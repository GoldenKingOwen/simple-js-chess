import type { Game, GameInvitation } from "./game";
import type { User } from "./user";

/** Successful 2xx API responses are usually `{ data }`. */
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/** Pagination metadata returned by list endpoints. */
export interface ApiListMeta {
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiList<T> {
  data: T[];
  meta: ApiListMeta;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, string[]>;
  timestamp?: string;
  path?: string;
}

/** Normalized error surfaced to the UI. Raw API errors are never shown. */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly details?: Record<string, string[]>;

  constructor(message: string, statusCode = 0, details?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface AuthUser {
  user: User;
  token: string;
  expiresAt: string;
}

export interface LoginInput {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface MatchmakingTicket {
  id: string;
  status: "searching" | "found" | "cancelled" | "expired";
  timeControlId: string;
  rated: boolean;
  createdAt: string;
  matchedGameId?: string;
  match?: {
    opponent: User;
    gameId: string;
    color: "w" | "b";
    countdownMs: number;
  };
}

export interface DashboardData {
  user: User;
  stats: {
    rating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  };
  recentGames: Game[];
  friendsOnline: User[];
  invitations: GameInvitation[];
  notifications: number;
}

export interface ApiStatus {
  status: "ok" | "degraded";
  version?: string;
}
