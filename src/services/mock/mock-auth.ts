import { isDev } from "@/config/env";
import type { AuthUser, User } from "@/types";
import { ApiError } from "@/types";
import type { AuthService } from "../auth-service";
import { MOCK_CURRENT_USER } from "./mock-data";

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, isDev ? ms : 0));

const FAKE_TOKEN = "mock-jwt-token-for-development-only";

/**
 * Mock auth service for frontend development. Validates inputs for UX and
 * returns a fixed demo user. Replaced by the real NestJS backend when
 * `NEXT_PUBLIC_API_URL` is set.
 */
export const mockAuth: AuthService = {
  async login(input) {
    await delay();
    if (!input.usernameOrEmail || !input.password) {
      throw new ApiError("Username/email and password are required.", 400);
    }
    return {
      user: MOCK_CURRENT_USER,
      token: FAKE_TOKEN,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    } satisfies AuthUser;
  },
  async register(input) {
    await delay();
    if (!input.username || !input.email || !input.password) {
      throw new ApiError("All fields are required.", 400);
    }
    return {
      user: { ...MOCK_CURRENT_USER, username: input.username, email: input.email },
      token: FAKE_TOKEN,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    } satisfies AuthUser;
  },
  async me() {
    await delay(200);
    return MOCK_CURRENT_USER satisfies User;
  },
  async refresh() {
    await delay(200);
    return {
      user: MOCK_CURRENT_USER,
      token: FAKE_TOKEN,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    } satisfies AuthUser;
  },
  async forgotPassword() {
    await delay();
    return;
  },
  async resetPassword() {
    await delay();
    return;
  },
  async logout() {
    await delay(100);
    return;
  },
};