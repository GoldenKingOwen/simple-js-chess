import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import { mapUser } from "@/lib/api/adapters";
import type { Friend, FriendRequest, FriendRequestStatus, User } from "@/types";
import { mockFriends } from "./mock/mock-friends";

export interface FriendService {
  getFriends(): Promise<Friend[]>;
  getPendingRequests(): Promise<FriendRequest[]>;
  getSentRequests(): Promise<FriendRequest[]>;
  searchPlayers(query: string): Promise<User[]>;
  sendFriendRequest(userId: string): Promise<void>;
  /** Accept/reject by the sender's user id (the backend keys requests on userId). */
  respondFriendRequest(userId: string, accept: boolean): Promise<void>;
  removeFriend(userId: string): Promise<void>;
}

const realFriendService: FriendService = {
  async getFriends() {
    const raw = await apiClient.get<unknown[]>("/friends");
    return (Array.isArray(raw) ? raw : []).map(toFriend);
  },
  async getPendingRequests() {
    const raw = await apiClient.get<unknown[]>("/friends/requests");
    return (Array.isArray(raw) ? raw : []).map(toFriendRequest);
  },
  async getSentRequests() {
    // The backend only exposes incoming requests; sent ones are not available.
    const raw = await apiClient.get<unknown[]>("/friends/requests");
    return (Array.isArray(raw) ? raw : []).map(toFriendRequest);
  },
  async searchPlayers(query) {
    const raw = await apiClient.get<unknown[]>("/users/search", { query: { q: query, limit: 20 } });
    return (Array.isArray(raw) ? raw : []).map((user) => mapUser(user as Record<string, unknown>));
  },
  async sendFriendRequest(userId) {
    await apiClient.post(`/friends/${userId}/request`);
  },
  async respondFriendRequest(userId, accept) {
    await apiClient.post(`/friends/${userId}/${accept ? "accept" : "reject"}`);
  },
  async removeFriend(userId) {
    await apiClient.delete(`/friends/${userId}`);
  },
};

function toFriend(item: unknown): Friend {
  const record = (item ?? {}) as Record<string, unknown>;
  const user = record.user && typeof record.user === "object" ? (record.user as Record<string, unknown>) : record;
  return {
    user: mapUser(user),
    since: typeof record.since === "string" ? record.since : "",
  };
}

function toFriendRequest(item: unknown): FriendRequest {
  const record = (item ?? {}) as Record<string, unknown>;
  const sender =
    record.sender && typeof record.sender === "object"
      ? (record.sender as Record<string, unknown>)
      : {
          id: record.userId,
          username: record.username,
          rating: record.rating,
          avatarUrl: record.avatarUrl,
        };
  const statusRaw = String(record.status ?? "pending").toLowerCase();
  const status: FriendRequestStatus =
    statusRaw === "accepted" || statusRaw === "declined" || statusRaw === "cancelled" ? statusRaw : "pending";
  return {
    id: String(record.id ?? ""),
    sender: mapUser(sender),
    receiver: mapUser((record.receiver as Record<string, unknown> | undefined) ?? {}),
    status,
    createdAt: String(record.createdAt ?? ""),
  };
}

export const friendService: FriendService = USE_MOCK_API ? mockFriends : realFriendService;
