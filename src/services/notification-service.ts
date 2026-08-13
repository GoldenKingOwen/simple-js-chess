import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import type { MarkNotificationsReadInput, NotificationPage } from "@/types";
import { mockNotifications } from "./mock/mock-notifications";

export interface NotificationService {
  getNotifications(cursor?: string): Promise<NotificationPage>;
  getUnreadCount(): Promise<number>;
  markRead(input: MarkNotificationsReadInput): Promise<void>;
}

/**
 * REST endpoints (see docs/backend-contract.md):
 * GET /notifications?cursor=, GET /notifications/unread-count,
 * POST /notifications/read (ids | all).
 */
const realNotificationService: NotificationService = {
  async getNotifications(cursor) {
    const { data } = await apiClient.get<{ data: NotificationPage }>("/notifications", {
      query: { cursor },
    });
    return data;
  },
  async getUnreadCount() {
    const { data } = await apiClient.get<{ data: number }>("/notifications/unread-count");
    return data;
  },
  async markRead(input) {
    await apiClient.post("/notifications/read", input);
  },
};

export const notificationService: NotificationService = USE_MOCK_API
  ? mockNotifications
  : realNotificationService;