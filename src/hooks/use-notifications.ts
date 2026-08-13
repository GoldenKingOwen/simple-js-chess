"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification-service";

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: (cursor?: string) => [...notificationsKeys.all, "list", cursor ?? ""] as const,
  unread: ["notifications", "unread"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationsKeys.list(),
    queryFn: () => notificationService.getNotifications(),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationsKeys.unread,
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { ids?: string[]; all?: boolean }) => notificationService.markRead(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
      if (input.all) queryClient.setQueryData(notificationsKeys.unread, 0);
    },
  });
}