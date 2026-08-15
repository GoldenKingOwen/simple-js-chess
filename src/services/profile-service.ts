import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import { mapUser } from "@/lib/api/adapters";
import type {
  ChangePasswordInput,
  Profile,
  ProfileStats,
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

const realProfileService: ProfileService = {
  async getProfile(username) {
    const encoded = encodeURIComponent(username);
    const userRaw = await apiClient.get<Record<string, unknown>>(`/users/${encoded}`);
    const [statsRaw, gamesRaw, historyRaw] = await Promise.all([
      apiClient.get<Record<string, unknown>>(`/profiles/${encoded}`).catch(() => null),
      apiClient.get<unknown>(`/users/${encoded}/games`).catch(() => []),
      userRaw?.id
        ? apiClient.get<unknown>(`/ratings/users/${userRaw.id}/history`).catch(() => null)
        : Promise.resolve(null),
    ]);

    const ratingHistory = historyRaw ? toRatingPoints(historyRaw) : [];
    const user = mapUser(userRaw);
    const stats = toStats(statsRaw ?? {});
    // /users/:username omits the rating — /profiles/:username carries it.
    const profileRating = (statsRaw as Record<string, unknown> | null)?.rating;
    if (typeof profileRating === "number" && Number.isFinite(profileRating)) {
      user.rating = profileRating;
    }
    const recentGames = toGameIds(gamesRaw).slice(0, 6);

    return {
      ...user,
      bio: typeof userRaw?.bio === "string" ? userRaw.bio : null,
      country: typeof userRaw?.country === "string" ? userRaw.country : null,
      stats,
      ratingHistory,
      recentGames,
      friendStatus: "none",
    } satisfies Profile;
  },
  async getCurrentUser() {
    const raw = await apiClient.get<Record<string, unknown> | { user: Record<string, unknown> }>("/auth/me");
    const user = raw && "user" in raw && raw.user && typeof raw.user === "object" ? raw.user : raw;
    return mapUser(user as Record<string, unknown>);
  },
  async updateProfile(input) {
    // No update-profile endpoint on the backend yet — surfaced as a clean error.
    const raw = await apiClient.patch<Record<string, unknown>>("/users/me", input);
    return mapUser(raw);
  },
  async changePassword(input) {
    await apiClient.patch("/auth/password", input);
  },
  async updateEmail(input) {
    // No update-email endpoint on the backend yet — surfaced as a clean error.
    await apiClient.patch("/users/me/email", input);
  },
  async getRatingHistory(username) {
    const user = await apiClient.get<Record<string, unknown>>(`/users/${encodeURIComponent(username)}`);
    if (!user?.id) return [];
    const raw = await apiClient.get<unknown>(`/ratings/users/${user.id}/history`);
    return toRatingPoints(raw);
  },
};

function toStats(raw: Record<string, unknown>): ProfileStats {
  const numberOr = (key: string, fallback = 0) => {
    const value = raw[key];
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const wins = numberOr("wins");
  const losses = numberOr("losses");
  const draws = numberOr("draws");
  const gamesPlayed = numberOr("gamesPlayed", wins + losses + draws);
  const winRate = numberOr("winRate", gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0);
  return {
    gamesPlayed,
    wins,
    losses,
    draws,
    winRate,
    currentStreak: numberOr("currentStreak"),
    bestStreak: numberOr("bestStreak"),
    longestWinStreak: numberOr("longestWinStreak"),
    timePlayedMs: numberOr("timePlayedMs"),
  };
}

function toRatingPoints(raw: unknown): RatingPoint[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>)?.history)
      ? ((raw as Record<string, unknown>).history as unknown[])
      : [];
  return list.map((point) => {
    const p = (point ?? {}) as Record<string, unknown>;
    return {
      date: String(p.date ?? p.createdAt ?? p.timestamp ?? ""),
      rating: typeof p.rating === "number" ? p.rating : Number(p.rating ?? 0),
    };
  });
}

function toGameIds(raw: unknown): string[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>)?.data)
      ? ((raw as Record<string, unknown>).data as unknown[])
      : Array.isArray((raw as Record<string, unknown>)?.games)
        ? ((raw as Record<string, unknown>).games as unknown[])
        : [];
  return list
    .map((game) => String((game as Record<string, unknown>)?.id ?? ""))
    .filter((id) => id.length > 0);
}

export const profileService: ProfileService = USE_MOCK_API ? mockUsers : realProfileService;
