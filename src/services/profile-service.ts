import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import type {
  ChangePasswordInput,
  Profile,
  RatingPoint,
  UpdateEmailInput,
  UpdateProfileInput,
  User,
} from "@/types";
import { mockUsers } from "./mock/mock-users";

export interface ProfileService {
  getProfile(username: string): Promise<Profile>;
  getCurrentUser(): Promise<User>;
  updateProfile(input: UpdateProfileInput): Promise<User>;
  changePassword(input: ChangePasswordInput): Promise<void>;
  updateEmail(input: UpdateEmailInput): Promise<void>;
  getRatingHistory(username: string): Promise<RatingPoint[]>;
}

/**
 * REST endpoints (see docs/backend-contract.md):
 * GET /users/:username, GET /users/me, PATCH /users/me,
 * POST /users/me/password, PATCH /users/me/email, GET /users/:username/ratings.
 */
const realProfileService: ProfileService = {
  async getProfile(username) {
    const { data } = await apiClient.get<{ data: Profile }>(`/users/${username}`);
    return data;
  },
  async getCurrentUser() {
    const { data } = await apiClient.get<{ data: User }>("/users/me");
    return data;
  },
  async updateProfile(input) {
    const { data } = await apiClient.patch<{ data: User }>("/users/me", input);
    return data;
  },
  async changePassword(input) {
    await apiClient.post("/users/me/password", input);
  },
  async updateEmail(input) {
    await apiClient.patch("/users/me/email", input);
  },
  async getRatingHistory(username) {
    const { data } = await apiClient.get<{ data: RatingPoint[] }>(`/users/${username}/ratings`);
    return data;
  },
};

export const profileService: ProfileService = USE_MOCK_API ? mockUsers : realProfileService;