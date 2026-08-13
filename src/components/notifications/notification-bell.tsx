"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, useUnreadCount } from "@/hooks/use-notifications";
import { useMarkNotificationsRead } from "@/hooks/use-notifications";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

export function NotificationBell() {
  const { data: page, isLoading } = useNotifications();
  const { data: unread } = useUnreadCount();
  const markRead = useMarkNotificationsRead();

  const unreadCount = unread ?? page?.unreadCount ?? 0;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            className="relative"
          />
        }
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold">Notifications</span>
          <Button
            variant="link"
            size="sm"
            className="h-auto px-0 text-xs"
            disabled={unreadCount === 0}
            onClick={() => markRead.mutate({ all: true })}
          >
            Mark all read
          </Button>
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (page?.notifications.length ?? 0) === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">You&apos;re all caught up!</p>
          ) : (
            <ul role="list">
              {page?.notifications.slice(0, 8).map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={notification.href ?? "/notifications"}
                    className={cn(
                      "flex w-full flex-col gap-0.5 border-b px-4 py-3 text-left transition hover:bg-accent/40",
                      !notification.read && "bg-primary/[0.04]",
                    )}
                    onClick={() => {
                      if (!notification.read) markRead.mutate({ ids: [notification.id] });
                    }}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-medium">{notification.title}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">{notification.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <Link
          href="/notifications"
          className="block border-t px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-accent/40"
        >
          View all
        </Link>
      </PopoverContent>
    </Popover>
  );
}