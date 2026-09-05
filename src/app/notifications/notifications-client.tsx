"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Bell, CheckCheck, Gamepad2, Gift, Swords, Trophy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { notificationService } from "@/services/notification-service";
import { toast } from "sonner";
import type { AppNotification, NotificationType } from "@/types";
import { cn } from "@/lib/utils";

const ICONS: Record<NotificationType, typeof Bell> = {
  friend_request: UserPlus,
  friend_request_accepted: UserPlus,
  game_invitation: Gamepad2,
  challenge: Swords,
  game_result: Trophy,
  achievement: Award,
  match_found: Gift,
  system: Bell,
};

export function NotificationsClient() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationService.getNotifications(),
  });

  const markAll = useMutation({
    mutationFn: () => notificationService.markRead({ all: true }),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-muted-foreground">Your latest alerts and updates.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || (data?.unreadCount ?? 0) === 0}
        >
          <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden="true" /> Mark all read
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All notifications</CardTitle>
          <CardDescription>{data?.unreadCount ?? 0} unread</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : data?.notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            <ul className="divide-y">
              {data?.notifications.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationRow({ notification }: { notification: AppNotification }) {
  const Icon = ICONS[notification.type] ?? Bell;
  const content = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          notification.severity === "success" && "bg-emerald-500/10 text-emerald-600",
          notification.severity === "warning" && "bg-amber-500/10 text-amber-600",
          notification.severity === "error" && "bg-destructive/10 text-destructive",
          notification.severity === "info" && "bg-primary/10 text-primary",
        )}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm", notification.read ? "font-normal text-muted-foreground" : "font-semibold")}>
          {notification.title}
        </span>
        <span className="block text-xs text-muted-foreground">{notification.body}</span>
      </span>
      {!notification.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
    </>
  );

  const className =
    "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent/40";

  return (
    <li>
      {notification.href ? (
        <Link href={notification.href} className={className}>
          {content}
        </Link>
      ) : (
        <span className={className}>{content}</span>
      )}
    </li>
  );
}