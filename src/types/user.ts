export type UserRole = "user" | "admin";

export type UserStatus = "online" | "offline" | "in-game";

export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string | null;
  rating: number;
  title?: string | null;
  status: UserStatus;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface ProfileStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  longestWinStreak: number;
  timePlayedMs: number;
}

export interface Profile extends User {
  bio: string | null;
  country: string | null;
  stats: ProfileStats;
  ratingHistory: RatingPoint[];
  recentGames: string[];
  friendStatus: "none" | "friends" | "outgoing" | "incoming" | "blocked";
}

export interface RatingPoint {
  date: string;
  rating: number;
}

export interface Rating {
  userId: string;
  username: string;
  rating: number;
  gamesPlayed: number;
  blitz: number;
  rapid: number;
  bullet: number;
}

export interface UpdateProfileInput {
  username?: string;
  bio?: string;
  country?: string;
  avatarUrl?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateEmailInput {
  email: string;
}

export interface PrivacySettings {
  allowChallenges: boolean;
  allowFriendRequests: boolean;
  showOnlineStatus: boolean;
  allowChat: boolean;
}

export interface GamePreferences {
  showLegalMoves: boolean;
  highlightLastMove: boolean;
  showCoordinates: boolean;
  confirmMoves: boolean;
  autoQueen: boolean;
  boardFlip: boolean;
  animations: boolean;
  sound: boolean;
  boardTheme: string;
  pieceStyle: string;
}

export interface AccountSettings {
  privacy: PrivacySettings;
  game: GamePreferences;
}
