import { isDev } from "@/config/env";
import type { AppNotification, MarkNotificationsReadInput } from "@/types";
import type { NotificationService } from "../notification-service";
import { MOCK_USERS } from "./mock-data";

const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, isDev ? ms : 0));

const seed: AppNotification[] = [
  {
    id: "n1",
    type: "challenge",
    title: "Rematch requested",
    body: "RookTaker sent you a rematch request.",
    severity: "info",
    href: "/game/mock-1",
    read: false,
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: "n2",
    type: "friend_request",
    title: "New friend request",
    body: "KnightShift wants to be your friend.",
    severity: "info",
    href: "/friends",
    read: false,
    createdAt: new Date(Date.now() - 3_600_000 * 5).toISOString(),
  },
  {
    id: "n3",
    type: "game_result",
    title: "You won!",
    body: "You defeated PawnStorm (+9 rating).",
    severity: "success",
    href: "/game/g5",
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "n4",
    type: "friend_request_accepted",
    title: "Request accepted",
    body: "QueenBee accepted your friend request.",
    severity: "success",
    href: "/friends",
    read: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "n5",
    type: "system",
    title: "Welcome to the new chess platform",
    body: "Play a local game or challenge the bot to get started.",
    severity: "info",
    href: "/dashboard",
    read: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "n6",
    type: "game_invitation",
    title: "Game invitation",
    body: `${MOCK_USERS[0].username} invited you to a rated rapid game.`,
    severity: "warning",
    href: "/games",
    read: false,
    createdAt: new Date(Date.now() - 3_600_000 * 8).toISOString(),
  },
];

const notifications: AppNotification[] = [...seed];

export const mockNotifications: NotificationService = {
  async getNotifications() {
    await delay();
    const unreadCount = notifications.filter((n) => !n.read).length;
    return { notifications: [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), unreadCount, nextCursor: null };
  },
  async getUnreadCount() {
    await delay(120);
    return notifications.filter((n) => !n.read).length;
  },
  async markRead(input: MarkNotificationsReadInput) {
    await delay(120);
    if (input.all) {
      for (const n of notifications) n.read = true;
    } else if (input.ids) {
      for (const n of notifications) if (input.ids.includes(n.id)) n.read = true;
    }
  },
};