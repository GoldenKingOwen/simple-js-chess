import type { User } from "./user";

export type FriendRequestStatus = "pending" | "accepted" | "declined" | "cancelled";

export type FriendStatus = "friends" | "outgoing" | "incoming" | "none" | "blocked";

export interface Friend {
  user: User;
  since: string;
}

export interface FriendRequest {
  id: string;
  sender: User;
  receiver: User;
  status: FriendRequestStatus;
  createdAt: string;
}

export interface FriendSearchResult {
  users: User[];
  total: number;
}

export interface Challenge {
  id: string;
  challengerId: string;
  challengeeId: string;
  timeControlId: string;
  rated: boolean;
}