import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import type { AppNotification, MarkNotificationsReadInput, NotificationPage, NotificationType, NotificationSeverity } from "@/types";
import { mockNotifications } from "./mock/mock-notifications";

export interface NotificationService {
  getNotifications(cursor?: string): Promise<NotificationPage>;
  getUnreadCount(): Promise<number>;
  markRead(input: MarkNotificationsReadInput): Promise<void>;
}

const realNotificationService: NotificationService = {
  async getNotifications(cursor) {
    // The backend pages with ?limit=&before= (cursor maps to `before`).
    const raw = await apiClient.get<unknown>("/notifications", { query: { limit: 30, before: cursor } });
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as Record<string, unknown>)?.notifications)
        ? ((raw as Record<string, unknown>).notifications as unknown[])
        : Array.isArray((raw as Record<string, unknown>)?.items)
          ? ((raw as Record<string, unknown>).items as unknown[])
          : [];
    const notifications = list.map(toNotification);
    const unread = notifications.filter((n) => !n.read).length;
    return {
      notifications,
      unreadCount: unread,
      nextCursor: notifications.length ? notifications[notifications.length - 1].createdAt : null,
    };
  },
  async getUnreadCount() {
    const raw = await apiClient.get<unknown>("/notifications/unread-count");
    const record = raw as Record<string, unknown> | null | undefined;
    return typeof record?.count === "number" ? record.count : 0;
  },
  async markRead(input) {
    const ids = input.all ? await allUnreadIds() : (input.ids ?? []);
    // The backend marks one notification at a time.
    await Promise.all(ids.map((id) => apiClient.patch(`/notifications/${id}/read`).catch(() => undefined)));
  },
};

async function allUnreadIds(): Promise<string[]> {
  const page = await realNotificationService.getNotifications();
  return page.notifications.filter((n) => !n.read).map((n) => n.id);
}

const NOTIFICATION_TYPES: Record<string, NotificationType> = {
  FRIEND_REQUEST: "friend_request",
  FRIEND_REQUEST_ACCEPTED: "friend_request_accepted",
  GAME_INVITATION: "game_invitation",
  INVITATION: "game_invitation",
  CHALLENGE: "challenge",
  GAME_ENDED: "game_result",
  GAME_RESULT: "game_result",
  MATCH_FOUND: "match_found",
  SYSTEM: "system",
};

function toNotification(item: unknown): AppNotification {
  const n = (item ?? {}) as Record<string, unknown>;
  const typeRaw = String(n.type ?? "system").toUpperCase();
  const type: NotificationType = NOTIFICATION_TYPES[typeRaw] ?? "system";
  return {
    id: String(n.id ?? ""),
    type,
    title: String(n.title ?? (n.message ?? type)),
    body: String(n.body ?? (n.message ?? "")),
    severity: toSeverity(n.severity),
    href: typeof n.href === "string" ? n.href : typeof n.link === "string" ? n.link : null,
    read: n.read === true,
    createdAt: String(n.createdAt ?? n.timestamp ?? ""),
  };
}

function toSeverity(raw: unknown): NotificationSeverity {
  const value = String(raw ?? "info").toLowerCase();
  return value === "success" || value === "warning" || value === "error" ? value : "info";
}

export const notificationService: NotificationService = USE_MOCK_API
  ? mockNotifications
  : realNotificationService;
