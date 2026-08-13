import { isDev } from "@/config/env";
import type { Friend, FriendRequest, User } from "@/types";
import type { FriendService } from "../friend-service";
import { MOCK_CURRENT_USER, MOCK_USERS } from "./mock-data";

const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, isDev ? ms : 0));

const friends: Friend[] = MOCK_USERS.filter((_, index) => index % 2 === 0).map((user, index) => ({
  user,
  since: new Date(Date.now() - 86400000 * (30 + index * 11)).toISOString(),
}));

const pendingRequests: FriendRequest[] = [
  {
    id: "req-1",
    sender: MOCK_USERS[5],
    receiver: MOCK_CURRENT_USER,
    status: "pending",
    createdAt: new Date(Date.now() - 3_600_000 * 5).toISOString(),
  },
  {
    id: "req-2",
    sender: MOCK_USERS[6],
    receiver: MOCK_CURRENT_USER,
    status: "pending",
    createdAt: new Date(Date.now() - 3_600_000 * 26).toISOString(),
  },
];

const sentRequests: FriendRequest[] = [
  {
    id: "req-3",
    sender: MOCK_CURRENT_USER,
    receiver: MOCK_USERS[7],
    status: "pending",
    createdAt: new Date(Date.now() - 3_600_000 * 2).toISOString(),
  },
];

export const mockFriends: FriendService = {
  async getFriends() {
    await delay();
    return friends;
  },
  async getPendingRequests() {
    await delay();
    return pendingRequests;
  },
  async getSentRequests() {
    await delay();
    return sentRequests;
  },
  async searchPlayers(query) {
    await delay();
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return MOCK_USERS.filter(
      (user) => user.username.toLowerCase().includes(q) && user.id !== MOCK_CURRENT_USER.id,
    ).slice(0, 8) as User[];
  },
  async sendFriendRequest() {
    await delay();
    return;
  },
  async respondFriendRequest() {
    await delay();
    return;
  },
  async removeFriend() {
    await delay();
    return;
  },
};