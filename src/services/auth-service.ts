import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
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
  forgotPassword(input: ForgotPasswordInput): Promise<void>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
  logout(): Promise<void>;
}

/**
 * REST endpoints the future NestJS backend exposes (see docs/backend-contract.md).
 * POST /auth/login, POST /auth/register, GET /auth/me, POST /auth/logout,
 * POST /auth/forgot-password, POST /auth/reset-password.
 */
const realAuthService: AuthService = {
  async login(input) {
    const { data } = await apiClient.post<{ data: AuthUser }>("/auth/login", input);
    return data;
  },
  async register(input) {
    const { data } = await apiClient.post<{ data: AuthUser }>("/auth/register", input);
    return data;
  },
  async me() {
    const { data } = await apiClient.get<{ data: User }>("/auth/me");
    return data;
  },
  async forgotPassword(input) {
    await apiClient.post("/auth/forgot-password", input);
  },
  async resetPassword(input) {
    await apiClient.post("/auth/reset-password", input);
  },
  async logout() {
    await apiClient.post("/auth/logout");
  },
};

export const authService: AuthService = USE_MOCK_API ? mockAuth : realAuthService;