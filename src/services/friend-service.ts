import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import type { Friend, FriendRequest, User } from "@/types";
import { mockFriends } from "./mock/mock-friends";

export interface FriendService {
  getFriends(): Promise<Friend[]>;
  getPendingRequests(): Promise<FriendRequest[]>;
  getSentRequests(): Promise<FriendRequest[]>;
  searchPlayers(query: string): Promise<User[]>;
  sendFriendRequest(userId: string): Promise<void>;
  respondFriendRequest(requestId: string, accept: boolean): Promise<void>;
  removeFriend(userId: string): Promise<void>;
}

/**
 * REST endpoints (see docs/backend-contract.md):
 * GET /friends, GET /friends/requests/pending, GET /friends/requests/sent,
 * GET /users/search?q=, POST /friends/:userId, PUT /friends/requests/:id,
 * DELETE /friends/:userId.
 */
const realFriendService: FriendService = {
  async getFriends() {
    const { data } = await apiClient.get<{ data: Friend[] }>("/friends");
    return data;
  },
  async getPendingRequests() {
    const { data } = await apiClient.get<{ data: FriendRequest[] }>("/friends/requests/pending");
    return data;
  },
  async getSentRequests() {
    const { data } = await apiClient.get<{ data: FriendRequest[] }>("/friends/requests/sent");
    return data;
  },
  async searchPlayers(query) {
    const { data } = await apiClient.get<{ data: User[] }>("/users/search", { query: { q: query } });
    return data;
  },
  async sendFriendRequest(userId) {
    await apiClient.post(`/friends/${userId}`);
  },
  async respondFriendRequest(requestId, accept) {
    await apiClient.put(`/friends/requests/${requestId}`, { accept });
  },
  async removeFriend(userId) {
    await apiClient.delete(`/friends/${userId}`);
  },
};

export const friendService: FriendService = USE_MOCK_API ? mockFriends : realFriendService;