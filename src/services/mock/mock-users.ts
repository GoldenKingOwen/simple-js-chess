import { isDev } from "@/config/env";
import { ApiError } from "@/types";
import type {
  ChangePasswordInput,
  Profile,
  RatingPoint,
  UpdateEmailInput,
  User,
} from "@/types";
import type { ProfileService } from "../profile-service";
import { MOCK_CURRENT_USER, MOCK_USERS } from "./mock-data";

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, isDev ? ms : 0));

function profileOf(user: User): Profile {
  return {
    ...user,
    bio: "Chess lover working on becoming a titled player.",
    country: "US",
    stats: {
      gamesPlayed: 312,
      wins: 168,
      losses: 118,
      draws: 26,
      winRate: 53.8,
      currentStreak: 3,
      bestStreak: 9,
      longestWinStreak: 7,
      timePlayedMs: 86_400_000 * 41,
    },
    ratingHistory: buildRatingHistory(user.rating),
    recentGames: ["g1", "g2", "g3", "g4", "g5"],
    friendStatus: user.id === MOCK_CURRENT_USER.id ? "friends" : "none",
  };
}

function buildRatingHistory(finalRating: number): RatingPoint[] {
  const points: RatingPoint[] = [];
  let rating = finalRating - 220;
  for (let i = 0; i < 22; i++) {
    rating += Math.round((Math.random() * 2 - 0.6) * 14);
    points.push({
      date: new Date(Date.now() - (22 - i) * 86400000).toISOString().slice(0, 10),
      rating,
    });
  }
  return points;
}

export const mockUsers: ProfileService = {
  async getProfile(username) {
    await delay();
    const user = MOCK_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) throw new ApiError("User not found.", 404);
    return profileOf(user);
  },
  async getCurrentUser() {
    await delay(150);
    return MOCK_CURRENT_USER;
  },
  async updateProfile(input) {
    await delay();
    return { ...MOCK_CURRENT_USER, ...input } as User;
  },
  async changePassword(input: ChangePasswordInput) {
    await delay();
    void input;
    return;
  },
  async updateEmail(input: UpdateEmailInput) {
    await delay();
    void input;
    return;
  },
  async getRatingHistory(username) {
    await delay(150);
    const user = MOCK_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? MOCK_CURRENT_USER;
    return buildRatingHistory(user.rating);
  },
};