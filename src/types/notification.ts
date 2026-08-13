export type NotificationType =
  | "friend_request"
  | "friend_request_accepted"
  | "game_invitation"
  | "challenge"
  | "game_result"
  | "system"
  | "match_found";

export type NotificationSeverity = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  severity: NotificationSeverity;
  /** Link to navigate to when the notification is clicked. */
  href?: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationPage {
  notifications: AppNotification[];
  unreadCount: number;
  nextCursor: string | null;
}

export interface MarkNotificationsReadInput {
  ids?: string[];
  all?: boolean;
}