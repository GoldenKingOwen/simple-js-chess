import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import { mapUser } from "@/lib/api/adapters";
import type {
  AuthUser,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  User,
} from "@/types";
import { mockAuth } from "./mock/mock-auth";

export interface AuthService {
  login(input: LoginInput): Promise<AuthUser>;
  register(input: RegisterInput): Promise<AuthUser>;
  /** Fetch the authenticated user (token from client). */
  me(): Promise<User>;
  /** Rotate the refresh cookie into a fresh access token. */
  refresh(): Promise<AuthUser>;
  forgotPassword(input: ForgotPasswordInput): Promise<void>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
  logout(): Promise<void>;
}

/**
 * REST endpoints of the NestJS backend (see docs/backend-contract.md).
 * The backend returns `{ accessToken, user }` — no `{ data }` envelope — and
 * every route lives under /api/v1 (added by the ApiClient).
 */
const realAuthService: AuthService = {
  async login(input) {
    const session = await apiClient.post<{ accessToken: string; user: Record<string, unknown> }>("/auth/login", {
      identifier: input.usernameOrEmail,
      password: input.password,
    });
    return toAuthUser(session);
  },
  async register(input) {
    const session = await apiClient.post<{ accessToken: string; user: Record<string, unknown> }>("/auth/register", {
      username: input.username,
      email: input.email,
      password: input.password,
    });
    return toAuthUser(session);
  },
  async me() {
    const raw = await apiClient.get<Record<string, unknown> | { user: Record<string, unknown> }>("/auth/me");
    const user = raw && "user" in raw && raw.user && typeof raw.user === "object" ? raw.user : raw;
    return mapUser(user as Record<string, unknown>);
  },
  async refresh() {
    // POST /auth/refresh reads the httpOnly refresh cookie (credentials: include).
    const session = await apiClient.post<{ accessToken: string; user?: Record<string, unknown> | null }>("/auth/refresh");
    const user = session.user ? mapUser(session.user) : await realAuthService.me();
    return { user, token: session.accessToken, expiresAt: expiresAt() };
  },
  async forgotPassword(input) {
    // Not implemented by the backend yet — surfaced as a clean error by the client.
    await apiClient.post("/auth/forgot-password", input);
  },
  async resetPassword(input) {
    // Not implemented by the backend yet — surfaced as a clean error by the client.
    await apiClient.post("/auth/reset-password", input);
  },
  async logout() {
    await apiClient.post("/auth/logout");
  },
};

function toAuthUser(session: { accessToken: string; user?: Record<string, unknown> | null }): AuthUser {
  return {
    user: mapUser(session.user),
    token: session.accessToken,
    expiresAt: expiresAt(),
  };
}

/** Access tokens last 15 minutes on the backend. */
function expiresAt(): string {
  return new Date(Date.now() + 15 * 60_000).toISOString();
}

export const authService: AuthService = USE_MOCK_API ? mockAuth : realAuthService;
